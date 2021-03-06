Template.classroomPickList.onCreated(function(){
	console.log("in onCreated");
  var template = this;
  template.searchStr = new ReactiveVar("");
});

Template.classroomPickList.helpers({
  classrooms: function () {
    console.log(ClassroomKicker.getOpenClassroom().fetch().length);
    return ClassroomKicker.getOpenClassroom(Template.instance().searchStr.get());
  },
  getTeacherName:function(tid){
  	var teacherProfile = Meteor.users.findOne({_id:tid});
  	return teacherProfile.profile.lastName +", "+ teacherProfile.profile.firstName;
  },
  getImage:function(logoUrl){
  	return logoUrl===""?"/logo.png":logoUrl;
  }

});

Template.classroomPickList.events({
	"click .classroomItem":function(event){
    if(this.isProtected){
      var classId = this.id;
      ClassroomKicker.requestClassroomShortcode(classId);
    }
    
    // IonModal.close();
	},
  "input #classSearch":function(event,template){
    console.log(event.target.value);
    var searchStr = event.target.value;
    template.searchStr.set(searchStr);
  }
});