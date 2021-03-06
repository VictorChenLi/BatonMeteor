Meteor.publishComposite('classroomsInfo',function(){
	return {
		find:function(){
			// if(isTeacherAccount(this.userId)){
			// 	return ClassroomsInfo.find({sid:"1"});
			// } else {
			// 	return ClassroomsInfo.find({sid:"1"},{fields: {'shortcode.shortcode':0}});	
			// }
			return ClassroomsInfo.find({sid:"1"},{fields: {'shortcode.shortcode':0}});
		},
		children:[
			{
				find:function(classroomsInfo){
					// return teacher profile
					return Meteor.users.find({_id:classroomsInfo.tid},{fields:{'profile': 1}});
				}
			},
			{
				find:function(classroomsInfo){
					// return all the students attending this classs
					return Meteor.users.find({"profile.curClassId":classroomsInfo._id},{fields:{'profile': 1}});
				}
			}
		]	
	}
});

Meteor.publish("classSession",function(){
	return ClassSession.find({uid:this.userId});
});

// Meteor.publish('schoolsInfo',function(){
// 	return SchoolsInfo.find();
// });

// Meteor.publish('ticketsInfo',function(){
// 	if(isPharmacyAccount(this.userId))
// 		return OrdersInfo.find({ pid: getPharmacyStoreId(this.userId) });
// 	else
// 		return OrdersInfo.find({ uid: this.userId });
// });

// with extra users profile info
Meteor.publishComposite('ticketsInfoDetail',function(classroomId) { 
	return {

		find:function(){
			//TODO need restrict the publish permission
			// console.log("ticketsInfoDetail:",classroomId);
			return TicketsInfo.find({cid:classroomId});
		},
		children:[
			{
				find: function(ticketsInfo){
					return Meteor.users.find({_id: ticketsInfo.uid}, {fields: {'profile': 1}});
					
				}
			}
		]
	}
});

Meteor.publish("userProfile", function () {
  if (this.userId) {
    return Meteor.users.find({_id: this.userId});
  } else {
    this.ready();
  }
});