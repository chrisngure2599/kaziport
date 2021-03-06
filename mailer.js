var nodemailer = require('nodemailer');
require('dotenv').config()

var transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    }
  });

exports.send = (user,msg)=>{
    var mailOptions = {
        from: 'noreply@kaziport.com',
        to: user.email,
        subject: msg.subject,
        html:msg.text
        };
        transporter.sendMail(mailOptions, function(error, info){
          console.log(error);
        if (error) {
            console.log(error);
        } else {
            // console.log('Email sent: ' + info.response);
        }
        });
}