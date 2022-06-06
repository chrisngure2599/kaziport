var axios=require('axios');
const { random, sample } = require('lodash');
var mysql =require("mysql");
require('dotenv').config()
var con =mysql.createConnection({
    'host':process.env.DB_HOST,
    'user':process.env.DB_USER,
    "password":process.env.DB_PASSWORD,
    "database":process.env.DB_DATABASE
});


exports.get_users=()=>{
    let tl_url="https://api.telegram.org/bot"+process.env.TELEGRAM_BOT+"/getUpdates"
    axios.get(tl_url).then((response)=>{
        let res=response.data.result;
        var users=[]
        var sent=0;
        for (key in res){
            let data=res[key];
            if('my_chat_member' in data){
                var user_id=data['my_chat_member']['from']['id'];
            }else{
                var user_id=data['message']['from']['id'];
            }
            if(users.indexOf(user_id)<0){
                users.push(user_id)            
            }
        }
        //Adding the users to the database
        users.forEach(user => {
            //checking if user is present
            let curr_user="select * from telegram_users where user_id= "+user+" ";
            con.query(curr_user,(err,res,fields)=>{
                if(err) throw err;
                if(res.length==0){
                    //The user is not found
                    let new_user="INSERT INTO `telegram_users`(`user_id`) VALUES ("+user+")";
                    con.query(new_user,(err,res1)=>{//Adding the users
                        if(err) throw err;
                        if(res1.insertId){
                            console.log("Added new user "+user);
                        }
                    })
                }
            });
        });
        
    }).catch((err)=>{
        if(err) throw err;
    });

    //Selecting all people from the database;
    
}
exports.sendtg=(job)=>{
    var users=con.query("Select distinct user_id from telegram_users",(err,res,fields)=>{
        if (err) throw err;
        var sent=0;
        res.forEach(element => {
            let user_id=element.user_id;

            //Sending the message directly
            //Getting chat data
                var title="Kazi mpya: "+job['post'];
                let job_link= encodeURI("http://portal.ajira.go.tz/advert/display_advert/"+job.link)
                var sample_message="Habari , <b>"+title+" imetangazwa.</b>\n";
                sample_message+="Imetangazwa na : <b>"+job["employer"]+"</b>\n";
                sample_message+="Wanaohitajika : <b>"+job['candidates']+"</b>\n";
                sample_message+="Muda wa kutuma maombi : <b> "+job['application_timeline:']+"</b>\n";
                sample_message+="Malipo : <b>"+job['remuneration']+"</b>\n";
                sample_message+="\nMajukumu na Kazi\n";
                sample_message+=job['duties_and_responsibilities']+"\n";
                sample_message+="\n Ujuzi & Elimu \n"+job['qualification_and_experience']+"\n";
                sample_message+="\n "+job_link+" &lt Soma zaidi hapa!\n";
                sample_message+="<code> #KAZIPORT </code>\n"
                let sms_link="https://api.telegram.org/bot"+process.env.TELEGRAM_BOT
                sms_link+="/sendMessage?chat_id="+user_id;
                sent=1+sent+random(0.1,0.8);
                setTimeout(()=>{
                    axios.post(sms_link,{"text":sample_message,"parse_mode":"html"}).then((response)=>{
                        console.log("Sent TG to "+user_id);
                    }).catch((err)=>{
                        console.log("Failed "+err)
                    })
                    },random(1000,3000)*sent)
        });
        
    });
}