var Invite = require('../app/models/invites');
var Plan = require('../app/models/plans');
var Messages = require('../app/models/messages');
var User = require('../app/models/user');
var Baby = require('babyparse');
var Event = require('../app/models/events');
var Comments = require('../app/models/comments');
var crypto = require('crypto');
var config = require('../config');
var client = require('twilio')(config.twilio_sid, config.twilio_token);
var async = require("async");
var Twilio = require('../app/models/twilio');

function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len); // return required number of characters
}

exports.sendsms_invite = function(req, res) {

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
                    invite_status: "Added"
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
                            invite_code: new_invite.invite_code
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

exports.sendsms = function(req, res, callback) {
    User.findOne({
        _id: req.decoded._doc._id
    }, function(err, user) {
        if (err) throw err;
        Comments.create({
                event_id: req.params.event_id,
                displayname: user.displayname,
                text: req.body.message
            },
            function(err, result) {
                if (err)
                    throw err;
            });

        Invite.find({
                event_id: req.params.event_id,
                invite_status: "Added"
            },
            null, {
                sort: {
                    "created_at": -1
                }
            },
            function(err, invites) {
                if (err) res.send(err)
                console.log(invites);

                //  
                var body_message = req.body.message;
                invites.forEach(function(doc) {
                    async.series([
                        function(callback) {
                            Messages.findOne({
                                    event_id: req.params.event_id,
                                    user_phone: doc.invited_phone,
                                    twilio_number: doc.twilio_number,
                                    owner_phone: user.phone
                                },
                                function(err, message_result) {

                                    console.log('nooooooooooooooooooooooo')
                                    console.log(message_result)
                                    if (err) throw err;
                                    if (message_result) {
                                        console.log('yyeeeeeeeeeeeeeeeeeeee')
                                        body_message = req.body.message
                                    } else {
                                        body_message = req.body.message + '-Reply GETOUT to stop receving messages'
                                    }
                                    callback();
                                });
                        },
                        function(callback) {
                            console.log('d8d8d88d8d8')
                            console.log(doc.invited_phone)

                            client.sendMessage({
                                to: '+1' + doc.invited_phone,
                                from: doc.twilio_number,
                                //body: user.displayname + ' says: ' + req.body.message
                                body: user.displayname + ' says: ' + body_message

                            }, function(err, responseData) {
                                res.end('Done')
                                console.log(err)
                                if (!err) {}
                                Messages.create({
                                        event_id: req.params.event_id,
                                        user_phone: doc.invited_phone,
                                        message_type: "sms",
                                        twilio_number: doc.twilio_number,
                                        owner_phone: user.phone
                                    },
                                    function(err, result) {
                                        if (err)
                                            throw err;
                                    });
                                callback();
                            });
                        }
                    ], function(err) {
                        if (err) return next(err);
                    });
                });
            });
    });
}

exports.add_twilio_number = function(req, res) {
    console.log(req.body.twilio_number)
    Twilio.create({
            twilio_number: req.body.twilio_number,
            number_status: "free"
        },
        function(err, result) {
            if (err)
                throw err;
            console.log(result)
            res.json({
                success: true,
                message: 'Please check your phone for confirmation code'
            });
        });
}
exports.get_twilio_numbers = function(req, res) {
    console.log("get_twilio_numbers");
    Twilio.find({},
        function(err, twilio_numbers) {
            if (err) throw err;
            console.log(twilio_numbers);
            res.json({
                'twilio_numbers': twilio_numbers
            });
        });
}

exports.csv_upload = function(req, res) {
    console.log(req.files)
    var file = req.files.file;
    fs = require('fs')
    fs.readFile(file.path, function(err, data) {
        if (err) throw err;
        file_name_loc = './uploads/test1.csv';
        fs.writeFile(file_name_loc, data, function(err) {
            if (err) throw err;
            console.log('It\'s saved!');
            parsed = Baby.parseFiles(file_name_loc);
            rows = parsed.data;
            console.log(rows)
            res.json(rows);
        });
    });
}

exports.sendcsvsms = function(req, res) {

    console.log(req.body.phone_number)
    client.sendMessage({
        to: req.body.phone_number, // Any number Twilio can deliver to
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

exports.planstatus = function(req, res) {
    User.findOne({
        _id: req.decoded._doc._id
    }, function(err, user) {
        if (err) throw err;
        Plan.find({
                user_id: req.decoded._doc._id
            },
            function(err, plans) {
                if (err) throw err;
                if (plans.length) {

                    Messages.count({
                            user_phone: user.phone,
                            message_type: "mms"
                        },
                        function(err, messages_mms) {
                            if (err) throw err;
                    Messages.count({
                            user_phone: user.phone,
                            message_type: "sms"
                        },
                        function(err, messages_sms) {
                            if (err) throw err;
                            Event.count({
                                    event_creator: req.decoded._doc._id
                                },
                                function(err, event_count) {
                                    if (err) throw err;
                                    res.json({
                                        'plans': plans,
                                        'date_now': Date.now(),
                                        'event_count': event_count,
                                        'message_mms': messages_mms,
                                        'message_sms': messages_sms
                                    });
                                });
                           });
                        });
                } else {
                    res.json({
                        success: true,
                        message: 'No Plans Yet'
                    })
                }
            });
    });
}

exports.smsdata = function(req, res) {

    console.log(req.query.To);
    console.log("asdfasdfadsf");
    // console.log(req.query.To.replace('+1', ''));
    //   console.log(req.query.From);
    var FromNumber = req.query.From.replace('+1', '')

    Invite.find({
            twilio_number: req.query.To,
            invite_status: "Added"
        },
        null, {
            sort: {
                "created_at": -1
            }
        },
        function(err, invites) {
            if (err) res.send(err)
            console.log("invites")
            console.log(invites)
            Invite.findOne({
                    twilio_number: req.query.To,
                    invited_phone: FromNumber
                },
                function(err, sms_sender) {
                    if (err) res.send(err)
                    console.log("sms_sender")
                    console.log(sms_sender)
                    Event.find({
                            _id: sms_sender.event_id
                        },
                        function(err, events) {
                            if (err)
                                throw err;
                            console.log(events)
                                //console.log(events[0].event_reply_setting)

                            if (sms_sender) {
                                console.log(req.query.Body)
                            }
                            if (req.query.MediaUrl0){
                             Comments.create({
                                    event_id: sms_sender.event_id,
                                    displayname: sms_sender.invited,
                                    mms_image: req.query.MediaUrl0, 
                                    text: req.query.Body
                                },
                                function(err, result) {
                                    if (err) throw err;
                                });
                            }else{
                             Comments.create({
                                    event_id: sms_sender.event_id,
                                    displayname: sms_sender.invited,
                                    text: req.query.Body
                                },
                                function(err, result) {
                                    if (err) throw err;
                                });
                             }
                            if (req.query.Body.toLowerCase() == "getout") {
                                console.log("getttttttt   out")
                                console.log(FromNumber)

                                Invite.update({
                                        invited_phone: FromNumber,
                                        event_id: sms_sender.event_id,
                                        //_id: invite_id
                                    }, {
                                        $set: {
                                            invite_status: "Opted Out",
                                        }
                                    },
                                    function(err, result) {
                                        if (err)
                                            throw err;
                                        console.log("opppppppt")
                                        console.log(result);
                                    });
                                client.sendMessage({
                                    //  to: '+1' + doc.invited_phone,
                                    to: '+1' + events[0].event_creator_phone,
                                    from: req.query.To,
                                    body: sms_sender.invited + ' says: ' + req.query.Body

                                }, function(err, responseData) {
                                    Messages.create({
                                            event_id: sms_sender.event_id,
                                            //user_phone: doc.invited_phone, 
                                            user_phone: events[0].event_creator_phone,
                                            message_type: "sms",
                                            // twilio_number: doc.twilio_number, 
                                            twilio_number: req.query.To,
                                            owner_phone: events[0].event_creator_phone
                                        },
                                        function(err, result) {
                                            if (err)
                                                throw err;
                                        });
                                    res.end('Done')
                                    if (!err) {}
                                });
                            } else {
                                //io.sockets.emit("mms", sms_sender.event_id);
                                if (events[0].event_reply_setting == 'reply_all') {
                                    invites.forEach(function(doc) {
                                        if (doc.invited_phone) {
                                            console.log(doc.invited_phone)
                                         if (req.query.MediaUrl0){
                                            client.sendMessage({
                                                to: '+1' + doc.invited_phone,
                                                from: req.query.To,
                                                body: sms_sender.invited + ' says: ' + req.query.Body,
                                                mediaUrl: req.query.MediaUrl0
                                            }, function(err, responseData) {
                                                Messages.create({
                                                        event_id: sms_sender.event_id,
                                                        user_phone: doc.invited_phone,
                                                        message_type: "mms",
                                                        twilio_number: doc.twilio_number,
                                                        owner_phone: sms_sender.event_creator_phone
                                                    },
                                                    function(err, result) {
                                                        if (err) throw err;
                                                    });
                                                res.end('Done')
                                                if (!err) {}
                                            });
                                          }else{ //req.query.MediaUrl0
                                            client.sendMessage({
                                                to: '+1' + doc.invited_phone,
                                                from: req.query.To,
                                                body: sms_sender.invited + ' says: ' + req.query.Body,
                                            }, function(err, responseData) {
                                                Messages.create({
                                                        event_id: sms_sender.event_id,
                                                        user_phone: doc.invited_phone,
                                                        message_type: "sms",
                                                        twilio_number: doc.twilio_number,
                                                        owner_phone: sms_sender.event_creator_phone
                                                    },
                                                    function(err, result) {
                                                        if (err) throw err;
                                                    });
                                                res.end('Done')
                                                if (!err) {}
                                            });
                                          } //req.query.MediaUrl0
                                        }
                                    });
                                } else { // reply_all
                                 if (req.query.MediaUrl0){
                                    client.sendMessage({
                                        //  to: '+1' + doc.invited_phone,
                                        to: '+1' + events[0].event_creator_phone,
                                        from: req.query.To,
                                        body: sms_sender.invited + ' says: ' + req.query.Body,
                                        mediaUrl: req.query.MediaUrl0

                                    }, function(err, responseData) {
                                        Messages.create({
                                                event_id: sms_sender.event_id,
                                                //user_phone: doc.invited_phone, 
                                                user_phone: events[0].event_creator_phone,
                                                message_type: "mms",
                                                // twilio_number: doc.twilio_number, 
                                                twilio_number: req.query.To,
                                                owner_phone: events[0].event_creator_phone
                                            },
                                            function(err, result) {
                                                if (err)
                                                    throw err;
                                            });
                                        res.end('Done')
                                        if (!err) {}
                                    });
                                  } else {
                                    client.sendMessage({
                                        //  to: '+1' + doc.invited_phone,
                                        to: '+1' + events[0].event_creator_phone,
                                        from: req.query.To,
                                        body: sms_sender.invited + ' says: ' + req.query.Body
                                    }, function(err, responseData) {
                                        Messages.create({
                                                event_id: sms_sender.event_id,
                                                //user_phone: doc.invited_phone, 
                                                user_phone: events[0].event_creator_phone,
                                                message_type: "sms",
                                                // twilio_number: doc.twilio_number, 
                                                twilio_number: req.query.To,
                                                owner_phone: events[0].event_creator_phone
                                            },
                                            function(err, result) {
                                                if (err)
                                                    throw err;
                                            });
                                        res.end('Done')
                                        if (!err) {}
                                    });
                                 }


                                }
                            }
                        });
                });
        });


    /*
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
    */
}
