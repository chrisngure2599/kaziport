var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "b045c4b0e9723f",
      pass: "ca85ed91cfed31"
    }
  });

exports.send = (user,msg)=>{
    var mailOptions = {
        from: 'noreply@kaziport.com',
        to: 'myfriend@yahoo.com',
        subject: msg.subject,
        html: msg.text
        };
        
        transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
        });
}