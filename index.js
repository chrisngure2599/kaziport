var axios = require('axios');
var cheerio = require('cheerio');
var express = require('express');
const res = require('express/lib/response');
var mysql =require("mysql");
var app =express();

//Mysql database connection
var con =mysql.createConnection({
  'host':"localhost",
  'user':"root",
  "password":"",
  "database":"kaziport"
})


// app.get('/',function(req,res){
  // res.writeHead(200,{'content-type':'text/html'});
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
            job_data[title]=details;
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

  const savejob=(job)=>{
    let sql="INSERT INTO `jobs`(`post`, `candidates`, `category_id`, `application_timeline`, `employee_id`, `job_summary`, `duties_and_responsibilities`, `qualification_and_experience`, `remuneration`, `link`) VALUES";
     sql+="(#post,#candidates,'1',#application_timeline:,'1',#job_summary,#duties_and_responsibilities,#qualification_and_experience,#remuneration,#link)"
     //replacing the #tags with values where are th 
    for(key in job){
      sql=sql.replace("#"+key, con.escape(job[key]));
    }
    //checking for duplicate
    con.query("select * from jobs where link="+job['link'],function(err,response,fields){
      if(response.length==0){
        con.query(sql, function (error, result) {
          if (error) throw error;
          console.log("Done creating job"+job['post']);
        });
      }
    })
    
  }
  
  // res.end();
// });

app.listen("3000");