export function questionInstruction(question){
  if(!question)return "";
  if(question.type==="single")return "SELECT ONE ANSWER";
  if(question.type==="multi"){
    const count=Array.isArray(question.answer)?question.answer.length:0;
    return `SELECT ${count||"ALL REQUIRED"} ANSWER${count===1?"":"S"}`;
  }
  if(question.type==="order")return "ORDER ALL STEPS";
  return "";
}

export function shuffleOrderOptions(question,rng=Math.random){
  const options=[...(question?.options||[])];
  if(question?.type!=="order"||options.length<2)return options;
  for(let i=options.length-1;i>0;i--){
    const raw=Number(rng());
    const safe=Number.isFinite(raw)?Math.max(0,Math.min(0.999999999,raw)):0;
    const j=Math.floor(safe*(i+1));
    [options[i],options[j]]=[options[j],options[i]];
  }
  const answer=Array.isArray(question.answer)?question.answer:[];
  const solved=answer.length===options.length&&options.every((option,index)=>option.id===answer[index]);
  if(solved)[options[0],options[1]]=[options[1],options[0]];
  return options;
}

export function validateQuestionSubmission(question,answer){
  if(!question)return {ok:false,message:"Question data is unavailable."};
  if(question.type==="single")return answer?{ok:true}:{ok:false,message:"Select one answer before checking."};
  if(question.type==="multi"){
    const required=Array.isArray(question.answer)?question.answer.length:0;
    const selected=Array.isArray(answer)?answer.length:0;
    if(selected!==required)return {ok:false,message:`Select exactly ${required} answer${required===1?"":"s"}.`};
    return {ok:true};
  }
  if(question.type==="order"){
    const expected=(question.options||[]).length;
    if(!Array.isArray(answer)||answer.length!==expected)return {ok:false,message:"Assign every step a position before checking."};
    if(new Set(answer).size!==expected)return {ok:false,message:"Assign each step a unique position before checking."};
    return {ok:true};
  }
  return {ok:false,message:"Unsupported question format."};
}

export function optionFeedback(question,submission,optionId){
  const correct=question?.type==="single"?[question.answer]:Array.isArray(question?.answer)?question.answer:[];
  const selected=question?.type==="single"?[submission]:Array.isArray(submission)?submission:[];
  return {
    selected:selected.includes(optionId),
    correct:correct.includes(optionId),
    incorrect:selected.includes(optionId)&&!correct.includes(optionId)
  };
}
