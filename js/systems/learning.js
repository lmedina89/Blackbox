import { getState } from "../core/state.js";
import { on, emit } from "../core/events.js";
import {
  LEARNING_CONCEPTS, LEARNING_TRACKS, THREATDESK_QUESTIONS,
  QUESTION_MAP, CONCEPT_MAP, TRACK_MAP, LEGACY_TRAINING_IDS,
  RANGE_LEARNING_MAP, SERVICE_DESK_LEARNING_MAP
} from "../data/learning.js";

let listenersInitialized=false;
const absoluteNow=()=>{const s=getState();return ((s.world?.day||1)-1)*1440+(s.world?.minute||0);};
const unique=value=>[...new Set((Array.isArray(value)?value:[]).filter(x=>typeof x==="string"))];

function ensureLearning(){
  const s=getState();
  if(!s.learning||typeof s.learning!=="object"||Array.isArray(s.learning))s.learning={};
  const learning=s.learning;
  if(!learning.questionAttempts||typeof learning.questionAttempts!=="object"||Array.isArray(learning.questionAttempts))learning.questionAttempts={};
  if(!learning.topicStats||typeof learning.topicStats!=="object"||Array.isArray(learning.topicStats))learning.topicStats={};
  learning.reviewQueue=unique(learning.reviewQueue).filter(id=>QUESTION_MAP[id]);

  for(const [id,raw] of Object.entries(learning.questionAttempts)){
    if(!QUESTION_MAP[id]||!raw||typeof raw!=="object"||Array.isArray(raw)){delete learning.questionAttempts[id];continue;}
    raw.attempts=Math.max(0,Math.trunc(Number(raw.attempts)||0));
    raw.correct=Math.max(0,Math.trunc(Number(raw.correct)||0));
    raw.incorrect=Math.max(0,Math.trunc(Number(raw.incorrect)||0));
    raw.streak=Math.max(0,Math.trunc(Number(raw.streak)||0));
    raw.bestStreak=Math.max(raw.streak,Math.max(0,Math.trunc(Number(raw.bestStreak)||0)));
    raw.reviewStreak=Math.max(0,Math.trunc(Number(raw.reviewStreak)||0));
    raw.lastCorrect=typeof raw.lastCorrect==="boolean"?raw.lastCorrect:null;
    raw.lastAttemptAt=Number.isFinite(Number(raw.lastAttemptAt))?Math.max(0,Math.trunc(Number(raw.lastAttemptAt))):null;
    raw.firstCorrectAt=Number.isFinite(Number(raw.firstCorrectAt))?Math.max(0,Math.trunc(Number(raw.firstCorrectAt))):null;
    raw.history=Array.isArray(raw.history)?raw.history.filter(x=>x&&typeof x==="object").slice(-12):[];
  }

  for(const [id,raw] of Object.entries(learning.topicStats)){
    if(!CONCEPT_MAP[id]||!raw||typeof raw!=="object"||Array.isArray(raw)){delete learning.topicStats[id];continue;}
    raw.knowledgeAttempts=Math.max(0,Math.trunc(Number(raw.knowledgeAttempts)||0));
    raw.knowledgeCorrect=Math.max(0,Math.trunc(Number(raw.knowledgeCorrect)||0));
    raw.appliedCount=Math.max(0,Math.trunc(Number(raw.appliedCount)||0));
    raw.discoveredCount=Math.max(0,Math.trunc(Number(raw.discoveredCount)||0));
    raw.introducedAt=Number.isFinite(Number(raw.introducedAt))?Math.max(0,Math.trunc(Number(raw.introducedAt))):null;
    raw.lastAt=Number.isFinite(Number(raw.lastAt))?Math.max(0,Math.trunc(Number(raw.lastAt))):null;
    raw.evidence=unique(raw.evidence).slice(-120);
  }
  return learning;
}

function attemptState(questionId){
  const learning=ensureLearning();
  learning.questionAttempts[questionId]??={attempts:0,correct:0,incorrect:0,streak:0,bestStreak:0,reviewStreak:0,lastCorrect:null,lastAttemptAt:null,firstCorrectAt:null,history:[]};
  return learning.questionAttempts[questionId];
}

function topicState(conceptId){
  const learning=ensureLearning();
  learning.topicStats[conceptId]??={knowledgeAttempts:0,knowledgeCorrect:0,appliedCount:0,discoveredCount:0,introducedAt:null,lastAt:null,evidence:[]};
  return learning.topicStats[conceptId];
}

function touchTopic(conceptId,at=absoluteNow()){
  const topic=topicState(conceptId);
  if(topic.introducedAt==null)topic.introducedAt=at;
  topic.lastAt=at;
  return topic;
}

function addReview(questionId){
  const learning=ensureLearning();
  if(!learning.reviewQueue.includes(questionId))learning.reviewQueue.push(questionId);
}
function removeReview(questionId){
  const learning=ensureLearning();
  learning.reviewQueue=learning.reviewQueue.filter(id=>id!==questionId);
}

function sameAnswer(question,answer){
  if(question.type==="single")return String(answer??"")===String(question.answer);
  if(question.type==="multi"){
    const a=unique(answer).sort(),b=unique(question.answer).sort();
    return a.length===b.length&&a.every((value,index)=>value===b[index]);
  }
  if(question.type==="order"){
    const a=Array.isArray(answer)?answer.map(String):[],b=Array.isArray(question.answer)?question.answer.map(String):[];
    return a.length===b.length&&a.every((value,index)=>value===b[index]);
  }
  return false;
}

function answerLabels(question,answer){
  const ids=question.type==="single"?[String(answer??"")]:(Array.isArray(answer)?answer.map(String):[]);
  const map=Object.fromEntries(question.options.map(option=>[option.id,option.label]));
  return ids.map(id=>map[id]||id);
}

export function answerQuestion(questionId,answer,{mode="practice"}={}){
  const question=QUESTION_MAP[questionId];
  if(!question)return {ok:false,message:"Unknown ThreatDesk question."};
  const learning=ensureLearning(),attempt=attemptState(questionId),at=absoluteNow();
  const correct=sameAnswer(question,answer),wasEverCorrect=attempt.correct>0;
  attempt.attempts+=1;attempt.lastCorrect=correct;attempt.lastAttemptAt=at;
  if(correct){
    attempt.correct+=1;attempt.streak+=1;attempt.bestStreak=Math.max(attempt.bestStreak,attempt.streak);
    if(attempt.firstCorrectAt==null)attempt.firstCorrectAt=at;
    if(learning.reviewQueue.includes(questionId)){
      attempt.reviewStreak+=1;
      if(attempt.reviewStreak>=2)removeReview(questionId);
    }
  }else{
    attempt.incorrect+=1;attempt.streak=0;attempt.reviewStreak=0;addReview(questionId);
  }
  attempt.history.push({at,correct,mode,answer:question.type==="single"?String(answer??""):Array.isArray(answer)?answer.map(String):[]});
  if(attempt.history.length>12)attempt.history.splice(0,attempt.history.length-12);

  for(const conceptId of question.concepts){
    const topic=touchTopic(conceptId,at);topic.knowledgeAttempts+=1;if(correct)topic.knowledgeCorrect+=1;
    const key=`knowledge:threatdesk:${questionId}`;if(!topic.evidence.includes(key))topic.evidence.push(key);
  }

  if(correct&&LEGACY_TRAINING_IDS.includes(question.id)&&!getState().world.completedLabs.includes(question.id)){
    getState().world.completedLabs.push(question.id);
    emit("lab:completed",{labId:question.id,universe:"threatdesk"});
  }

  const payload={questionId:question.id,trackId:question.trackId,concepts:[...question.concepts],correct,mode,attempts:attempt.attempts,firstCorrect:correct&&!wasEverCorrect};
  emit("learning:experience",{kind:"knowledge",source:"threatdesk",refId:question.id,...payload});
  emit("learning:changed",payload);
  return {ok:true,correct,question,attempt:{...attempt},inReview:ensureLearning().reviewQueue.includes(questionId),selected:answerLabels(question,answer),message:correct?question.explanation:`Not quite. ${question.explanation}`};
}

export function recordLearningExperience({concepts=[],kind="applied",source="unknown",refId="unknown",quality=null,metadata=null}={}){
  const valid=unique(concepts).filter(id=>CONCEPT_MAP[id]);
  if(!valid.length)return {recorded:false,concepts:[]};
  const at=absoluteNow(),key=`${kind}:${source}:${refId}`;let recorded=false;
  for(const conceptId of valid){
    const topic=touchTopic(conceptId,at);
    if(topic.evidence.includes(key))continue;
    topic.evidence.push(key);if(topic.evidence.length>120)topic.evidence.splice(0,topic.evidence.length-120);
    if(kind==="applied")topic.appliedCount+=1;
    else if(kind==="discovered")topic.discoveredCount+=1;
    recorded=true;
  }
  if(recorded){
    const payload={concepts:valid,kind,source,refId,quality,metadata,at};
    emit("learning:experience",payload);emit("learning:changed",payload);
  }
  return {recorded,concepts:valid};
}

function backfillQuestion(questionId){
  const question=QUESTION_MAP[questionId];if(!question)return;
  const attempt=attemptState(questionId);if(attempt.attempts>0)return;
  const at=absoluteNow();attempt.attempts=1;attempt.correct=1;attempt.streak=1;attempt.bestStreak=1;attempt.lastCorrect=true;attempt.lastAttemptAt=at;attempt.firstCorrectAt=at;
  attempt.history=[{at,correct:true,mode:"legacy-backfill",answer:[]}];
  for(const conceptId of question.concepts){
    const topic=touchTopic(conceptId,at),key=`knowledge:threatdesk:${questionId}`;
    topic.knowledgeAttempts+=1;topic.knowledgeCorrect+=1;if(!topic.evidence.includes(key))topic.evidence.push(key);
  }
}

function reconcileExistingProgress(){
  const s=getState();ensureLearning();
  for(const questionId of s.world?.completedLabs||[])if(LEGACY_TRAINING_IDS.includes(questionId))backfillQuestion(questionId);
  for(const labId of s.nightwire?.range?.completed||[]){
    recordLearningExperience({concepts:RANGE_LEARNING_MAP[labId]||[],kind:"applied",source:"range",refId:labId,metadata:{backfilled:true}});
  }
  for(const ticketId of s.helpDesk?.completedTickets||[]){
    const progress=s.helpDesk?.ticketProgress?.[ticketId];
    if(progress?.status==="Resolved")recordLearningExperience({concepts:SERVICE_DESK_LEARNING_MAP[ticketId]||[],kind:"applied",source:"service_desk",refId:ticketId,quality:progress.score,metadata:{backfilled:true}});
  }
}

export function initLearning(){
  ensureLearning();reconcileExistingProgress();
  if(listenersInitialized)return;listenersInitialized=true;
  on("range:completed",result=>recordLearningExperience({concepts:RANGE_LEARNING_MAP[result?.labId]||[],kind:"applied",source:"range",refId:result?.labId||"unknown",quality:{noise:result?.noise,failedAuth:result?.failedAuth,hintsUsed:result?.hintsUsed},metadata:result||null}));
  on("helpdesk:changed",event=>{
    if(event?.type!=="resolved")return;
    recordLearningExperience({concepts:SERVICE_DESK_LEARNING_MAP[event.ticketId]||[],kind:"applied",source:"service_desk",refId:event.ticketId,quality:event.score??null,metadata:event});
  });
}

export function questionAttempt(questionId){const raw=ensureLearning().questionAttempts[questionId];return raw?structuredClone(raw):null;}
export function reviewQueue(){return [...ensureLearning().reviewQueue];}
export function questionById(questionId){return QUESTION_MAP[questionId]||null;}
export function questionsForTrack(trackId){return THREATDESK_QUESTIONS.filter(question=>question.trackId===trackId);}
export function trackById(trackId){return TRACK_MAP[trackId]||null;}

export function conceptStatus(conceptId){
  const topic=ensureLearning().topicStats[conceptId];
  if(!topic)return "UNSEEN";
  const reviewConcept=ensureLearning().reviewQueue.some(questionId=>QUESTION_MAP[questionId]?.concepts.includes(conceptId));
  if(reviewConcept)return "NEEDS REVIEW";
  if(topic.appliedCount>0&&topic.knowledgeCorrect>0)return "DEMONSTRATED";
  if(topic.appliedCount>0||topic.knowledgeCorrect>0)return "PRACTICED";
  return "INTRODUCED";
}

export function learningSnapshot(){
  const learning=ensureLearning();
  const concepts=LEARNING_CONCEPTS.map(concept=>({
    ...concept,status:conceptStatus(concept.id),stats:structuredClone(learning.topicStats[concept.id]||{knowledgeAttempts:0,knowledgeCorrect:0,appliedCount:0,discoveredCount:0,evidence:[]})
  }));
  const tracks=LEARNING_TRACKS.map(track=>{
    const questions=questionsForTrack(track.id),answered=questions.filter(q=>(learning.questionAttempts[q.id]?.attempts||0)>0).length,correct=questions.filter(q=>(learning.questionAttempts[q.id]?.correct||0)>0).length;
    const review=questions.filter(q=>learning.reviewQueue.includes(q.id)).length;
    const demonstrated=track.concepts.filter(id=>conceptStatus(id)==="DEMONSTRATED").length;
    const practiced=track.concepts.filter(id=>["PRACTICED","DEMONSTRATED"].includes(conceptStatus(id))).length;
    return {...track,questionCount:questions.length,answered,correct,review,demonstrated,practiced};
  });
  return {tracks,concepts,reviewQueue:[...learning.reviewQueue],questionAttempts:structuredClone(learning.questionAttempts),topicStats:structuredClone(learning.topicStats)};
}

export function nextPracticeQuestion(trackId,{reviewOnly=false}={}){
  const learning=ensureLearning(),pool=questionsForTrack(trackId).filter(q=>!reviewOnly||learning.reviewQueue.includes(q.id));
  if(!pool.length)return null;
  const inReview=pool.find(q=>learning.reviewQueue.includes(q.id));if(inReview)return inReview;
  const unseen=pool.find(q=>(learning.questionAttempts[q.id]?.attempts||0)===0);if(unseen)return unseen;
  return [...pool].sort((a,b)=>{
    const aa=learning.questionAttempts[a.id],bb=learning.questionAttempts[b.id];
    const ar=(aa?.correct||0)/(aa?.attempts||1),br=(bb?.correct||0)/(bb?.attempts||1);
    if(ar!==br)return ar-br;
    return (aa?.lastAttemptAt||0)-(bb?.lastAttemptAt||0);
  })[0]||null;
}
