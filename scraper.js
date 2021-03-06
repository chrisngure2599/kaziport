var axios = require('axios');
var cheerio = require('cheerio');
const { random } = require('lodash');
var mysql =require("mysql");
var mailer = require('./mailer');
var telegram = require('./telegram')
require('dotenv').config()


var con =mysql.createConnection({
  'host':process.env.DB_HOST,
  'user':process.env.DB_USER,
  "password":process.env.DB_PASSWORD,
  "database":process.env.DB_DATABASE
})

exports.scrape=()=>{
    telegram.get_users();//Getting Tg users
    let url="http://portal.ajira.go.tz/advert/index";
    axios.get(url).then(function(response){
      let html=response.data;
      let $=cheerio.load(html);
      var jobs_links=[];
      $("tbody").children().each(function(item){
              //each tablerow /td
              let link=$(this).find(".advert-title").attr("href");
              link=link.split("/");
              link=link[link.length-1]
              //Checking if work is in database to prevent duplicates
              jobs_links.push(link)
      })
      
      if(jobs_links.length>0){ 
        jobs_links.forEach(link => {
          //should check if present on DB
          let job_link="http://portal.ajira.go.tz/advert/display_advert/"+link
          axios.get(job_link).then(function(response){
            let html=response.data;
            let $=cheerio.load(html);
            let tbody=$("tbody").children();
            var job_data=[];
            tbody.each(function(tr){
              //every tr
              let title=$(this).find("td:nth-child(1)").text().trim().replace(/ /gi,'_').toLocaleLowerCase();
              
              let details=$(this).find("td:nth-child(2)").text().trim();
              if(title.length>0){
                    job_data[title]=details;
              }
              
            });
            job_data['candidates']=job_data['post'].split('-')
            job_data['candidates']=job_data['candidates'][job_data['candidates'].length-1].replace("POST","");
            job_data['link']=link;
            savejob(job_data);
          }).catch(function(error){
            console.log("Could not open"+job_link+" err "+error);
          })
        });
      }else{
        console.log("Could not find any jobs");
      }
      
      // res.write(data)
      // console.log(data)
    }).catch(function(error){
      // res.send("Failed to open the page"+error)
    });
  
    let mails=1;
    let tgs=1;
    const savejob=(job)=>{
      //checking for duplicate
      con.query("select * from jobs where link="+job['link'],function(err,response,fields){
        if (err) throw err;
        if(response.length==0){
          //preparation of other data;
          let sql="INSERT INTO `jobs`(`post`, `candidates`, `category_id`, `application_timeline`, `employee_id`, `job_summary`, `duties_and_responsibilities`, `qualification_and_experience`, `remuneration`, `link`) VALUES";
          sql+="(#post,#candidates,'1',#application_timeline:,'1',#job_summary,#duties_and_responsibilities,#qualification_and_experience,#remuneration,#link)"
          //replacing the #tags with values where are th 
          for(key in job){
            sql=sql.replace("#"+key, con.escape(job[key]));
          }
          con.query(sql, function (error, result) {
            if (error) throw error;
            console.log("Done creating job "+job['post']);
            //Sending the email
            if(result.insertId){
              //Fetching subscribers
              con.query('select * from subscribers',function(err,res,fields){
                if(err) throw err;
                let subs=[];
                if(res.length>0){
                    res.forEach(user => {
                      var title="Kazi mpya: "+job['post'];
                      var sample_email="Habari #jina kazi mpya.";
                      sample_email=sample_email.replace("#jina",user.full_name)
                      sample_email+="<ul>"
                      sample_email+="<li>Taarifa fupi</li>"
                      sample_email+="<li>Wanaohitajika <b>"+job['candidates']+"</b></li>"
                      sample_email+="Majukumu & Ujuzi";
                      sample_email+="<pre> "+job['duties_and_responsibilities']+" </pre>";
                      let job_link="http://portal.ajira.go.tz/advert/display_advert/"+job.link
                      sample_email+="<li>soma zaidi <a href="+job_link+">Hapa</a></li>";
                      sample_email+="</ul>";
                      mails+=0.35;
                      // if(user.email.length){
                      //     setTimeout(() => {
                      //       mailer.send(user,{'subject':title,"text":sample_email})
                      //     }, mails*10100);
                      // }
                    });
                }
              });
              //Sending Telegram
              tgs+=random(0.4,0.9);
              setTimeout(()=>{
                telegram.sendtg(job);
              },1000*tgs);
            }
          });
        }
      })
      
    }

    //Other functions
    const getId=(name,table)=>{ 
        //Cheking if present
        var rez="null";
        let sql="select * from "+table+" where name="+name+" LIMIT 1";
        // sql="select * from jobs where 1";
        con.query(sql,(err, res, fields)=>{
          if(err) throw err;
          if(res.length>0){
            //means found
          }else{
            //Adding new one
            sql="INSERT INTO "+table+" (`name`) VALUES ("+name+")";
            con.query(sql,(err,result)=>{
                if (err) throw err;
                
            })
          }
        })
    }
}