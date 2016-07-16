var Invite = require('../app/models/invites');
var Baby = require('babyparse');
var Event = require('../app/models/events');
var crypto = require('crypto');
var config = require('../config');
var client = require('twilio')(config.twilio_sid, config.twilio_token);

function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
}
exports.sendsms = function(req, res){

    Event.find({
            _id: req.params.event_id
        },
        function(err, events) {
            if (err)
                throw err;
            Invite.create({
                    event_id: req.params.event_id,
                    inviter: req.decoded._doc.username,
                    invited: req.body.text,
                    invited_email: req.body.email,
                    invited_phone: req.body.phone,
                    invited_type: req.body.type,
                    invite_code: randomValueHex(8),
                    invite_status: "Sent"
                },
                function(err, new_invite) {
                    console.log(events[0]["event_title"])
                    console.log("dksakdfksafkads")
                    client.sendMessage({

                        to: '+1' + req.body.phone, // Any number Twilio can deliver to
                        from: '+14152149049', // A number you bought from Twilio and can use for outbound communication
                        //body: req.body.sms_type // body of the SMS message
                        body: req.body.message

                    }, function(err, responseData) { //this function is executed when a response is received from Twilio
                   
                    console.log(err)
                        if (!err) { // "err" is an error received during the request, if any

                        }
                    });
                    if (err)
                        throw err;
                    Invite.find({
                            invite_code:  new_invite.invite_code
                        },
                        null, {
                            sort: {
                                "created_at": -1
                            }
                        },
                        function(err, invites) {
                            if (err)
                                res.send(err)
                            res.json({
                                'invites': invites
                            });
                        });
                }); //d8d88d
        });
}

exports.csv_upload = function(req, res){
console.log(req.files)
   var file = req.files.file;
   fs = require('fs')
   fs.readFile(file.path, function (err, data) {
    if (err) throw err;
    file_name_loc = './uploads/test1.csv';
    fs.writeFile(file_name_loc, data, function (err) {
        if (err) throw err;
        console.log('It\'s saved!');
        parsed = Baby.parseFiles(file_name_loc);
        rows = parsed.data;
        console.log(rows)
        res.json(rows);
    });
});
}

exports.sendcsvsms = function(req, res){

console.log(req.body.phone_number)
                    client.sendMessage({
                        to: '+1' + req.body.phone_number, // Any number Twilio can deliver to
                        from: '+14152149049', // A number you bought from Twilio and can use for outbound commu
                        body: req.body.text

                    }, function(err, responseData) { //this function is executed when a response is received from Twilio
                    res.end('Done')

                    console.log(responseData)
                    console.log(err)
                        if (!err) { // "err" is an error received during the request, if any

                        }
                    });
}


exports.smsdata = function(req, res){

    Invite.create({
            event_id: req.params.event_id,
            invited_email: req.query.From,
            invite_status: req.query.MediaUrl0
        },
        function(err, result) {
            if (err)
                throw err;
        });
    io.sockets.emit("mms", req.params.event_id);
}
