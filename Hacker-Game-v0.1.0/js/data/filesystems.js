export const FILESYSTEMS = {
  home:{
    "/":{
      type:"dir",
      children:{
        home:{type:"dir",children:{
          "readme.txt":{type:"file",content:"Welcome to your local machine.\nTry: ls, cd, cat, pwd, whoami, scan"},
          downloads:{type:"dir",children:{}}
        }}
      }
    }
  },
  archives01:{
    "/":{
      type:"dir",
      children:{
        home:{type:"dir",children:{
          guest:{type:"dir",children:{
            "motd.txt":{type:"file",content:"Northstar Training Archive\nGuest shell active.\nAuthorized training data only."}
          }}
        }},
        archive:{type:"dir",children:{
          "employees.db":{type:"file",content:"EMPLOYEE RECORD\nID: NS-4471\nNAME: MARCUS CARTER\nSTATUS: INACTIVE\nDEPARTMENT: FIELD SYSTEMS\nARCHIVE CLASS: TRAINING"}
        }},
        logs:{type:"dir",children:{
          "access.log":{type:"file",content:"03:11 guest login\n03:16 archive read\n03:17 session closed"}
        }}
      }
    }
  }
};
