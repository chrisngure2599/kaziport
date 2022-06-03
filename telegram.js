var axios=require('axios');
const { random } = require('lodash');
require('dotenv').config()
exports.sendtg=(job)=>{
    let tl_url="https://api.telegram.org/bot"+process.env.TELEGRAM_BOT+"/getUpdates"
    axios.get(tl_url).then((response)=>{
        let res=response.data.result;
        var users=[]
        var sent=0;
        for (key in res){
            let data=res[key];
            let user_id=data['message']['from']['id'];
            let name=data['message']['from']['first_name'];
            if(users.indexOf(user_id)<0){
                users.push(user_id)
                //Sending the message directly
                var title="Kazi mpya: "+job['post'];
                let job_link="http://portal.ajira.go.tz/advert/display_advert/"+job.link
                      var sample_message=name+" Kazi ("+job['post']+") imetangazwa tembelea "+job_link+" $Kaziport";
                      let sms_link="https://api.telegram.org/bot"+process.env.TELEGRAM_BOT
                      sms_link+="/sendMessage?chat_id="+user_id+"&text="+sample_message;
                      sent=1+sent+random(0.1,0.8);
                    setTimeout(()=>{
                        axios.get(encodeURI(sms_link)).then((response)=>{
                            console.log("Sent TG to "+name);
                        }).catch((err)=>{
                            console.log("Failed "+err)
                        })
                      },random(1000,3000)*sent)
                      
            }
        }
        
    }).catch((err)=>{
        if(err) throw err;
    });
}