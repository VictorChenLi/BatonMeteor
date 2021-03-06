// a ticket send helper on the client side
TicketShutter={
	//for student sent their ticket
	sendTicket: function(type,purpose,classroomId){
		//every student only have one waiting ticket at a time
		//TODO need make the currentTicket as a reactvar and keep within the class
		var currentTicket = TicketShutter.getCurrentTicket(type,classroomId);
		// console.log(classroomId);
		if( currentTicket === undefined)
		{
			//add a tickt to db
			var curId = TicketsInfo.insert({
				uid:Meteor.userId(),
				cid:classroomId,
				ticketType:type,
				ticketContent:purpose,
			});	
			currentTicket = TicketsInfo.findOne({_id:curId});
			// console.log("insert a ticket");
		}
		else
		{
			// update the current ticket
			// console.log(purpose);
			TicketsInfo.update({_id:currentTicket._id},{$set:{ticketContent:purpose}});
			// console.log("update a ticket");
		}
		analytics.track("Send Ticket Request", {
			category:"Student",
			label: currentTicket.ticketType,
			value: 1
		});

		return currentTicket;
	},
	//Simple version by using session var
	sendTicketAuto:function(purpose){
		return TicketShutter.sendTicket(Session.get("curMode"),purpose,Session.get("curClassroomId"));
	},
	// for student to cancel the ticket
	cancelTicket:function(ticketId){
		analytics.track("Cancel Ticket Request", {
			category:"Student",
			label:"",
			value: 1
		});
		Meteor.call("cancelTicket", ticketId);
	},
	// for student get their current waiting ticket
	getCurrentTicket:function(type,classroomId){
		return TicketsInfo.findOne({
			uid:Meteor.userId(),
			ticketType:type,
			cid:classroomId,
			status:Schemas.ticketStatus.waiting
		});
	},
	// for student get their classroom buddy
	getClassroomBuddyList:function(type,classroomId){
		return TicketsInfo.find({cid:classroomId,ticketType:type,status:Schemas.ticketStatus.waiting});
	},
	// for teacher get their classroom current attending student list, with latest ticket info
	getCurClassroomStudentList:function(classroomId, sessionObj) {
		var startDateFilter;
		if(!!sessionObj){
			startDateFilter = sessionObj.sessionStart;
		} else {
			startDateFilter = ClassroomKicker.getClassroomInfo(classroomId).createDate;
		}
		// console.log(startDateFilter);
		// in the publication we restrict only publish the student's profile who within current classroom or sent tickets
		var studentArray = Meteor.users.find({"profile.curClassId":classroomId}).fetch();
		var ticketRecordArray = new Array();
		for (var i = studentArray.length - 1; i >= 0; i--) {
			// only put the latest ticket
			var latestTicket = TicketsInfo.findOne({cid:classroomId,uid:studentArray[i]._id, "createDate" : { $gte : startDateFilter}},{sort:{updateDate:-1},limit:1});
			if(!!latestTicket){
				studentArray[i].ticketInfo = latestTicket;
			}
			// add participation info
			studentArray[i].participation = this.getParticipationInfo(studentArray[i]._id,classroomId,startDateFilter);
		}
		return studentArray;
	},
	// for teacher get their classroom current ticketlist
	getClassroomTicketList:function(type,classroomId){
		// console.log(type);
		// console.log(classroomId);
		var ticketArray = TicketsInfo.find({cid:classroomId,ticketType:type,status:Schemas.ticketStatus.waiting}).fetch();
		return this.getTicketRelativeInfo(ticketArray,classroomId);
	},
	getTicketRelativeInfo:function(ticketArray,classroomId){
		for (var i = ticketArray.length - 1; i >= 0; i--) {
    		//put user profile into ticket info
			ticketArray[i].user = Meteor.users.findOne({_id:ticketArray[i].uid});
			ticketArray[i].user.participation = this.getParticipationInfo(ticketArray[i].uid,classroomId);
		}
		return ticketArray;
	},
	getParticipationInfo:function(uid,classroomId,startDateFilter){
		if(!!!startDateFilter) startDateFilter = ClassroomKicker.getClassroomInfo(classroomId).createDate;
		//put student participation info into user
		var attendTimes = TicketsInfo.find({cid:classroomId,uid:uid,"createDate" : { $gte : startDateFilter}}).count();
		var selectedTimes = TicketsInfo.find({cid:classroomId,uid:uid,status:Schemas.ticketStatus.selected,"createDate" : { $gte : startDateFilter}}).count();
		var participation = new Object();	
		participation.attendTimes = attendTimes;
		participation.selectedTimes = selectedTimes;
		return participation;
	},
	getTicketInfoByID:function(ticketId){
		return TicketsInfo.findOne({_id:ticketId});
	},
	// for teacher confirm which ticket be selected
	selectTicket:function(ticketId){
		TicketsInfo.update({_id:ticketId},{$set:{status:Schemas.ticketStatus.selected}});
	},
 	pollFunc:function(fn, timeout, interval) {
	    var startTime = (new Date()).getTime();
	    interval = interval || 1000,
	    canPoll = true;

	    (function p() {
	        canPoll = ((new Date).getTime() - startTime ) <= timeout;
	        if (!fn() && canPoll)  { // ensures the function exucutes
	            setTimeout(p, interval);
	        }
	    })();
	},
	// for student setup current attendant class id
	attendClass:function(classroomId){
		Session.set("curClassroomId", classroomId);
		Meteor.users.update({_id:Meteor.userId()},{$set:{"profile.curClassId":classroomId}});
	},
	leaveClass:function(){
		Session.set("curClassroomId", undefined);
		Meteor.users.update({_id:Meteor.userId()},{$set:{"profile.curClassId":""}});
	}
}