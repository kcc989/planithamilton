// Array of colors used for the 4 courses
var colorArray = ["#BF4ECC", "#5BCC4E", "#CC9C4E", "#4E7ECC", "#CC4E4E", "#4ECCCC"];
// Number class of current classes
var count = 0;

// A list of the classes currently in use, needed to remove all course data 
var schedule = [];

// for hex conversions
var hexDigits = new Array
        ("0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"); 

// Get document height
var tableHeight = $(window).height() - 60;

// Get table row height
var tdHeight = Math.round(tableHeight/15)-3;
if (tdHeight < 45){
	tdHeight = 45;
}

// Convert duration to css class
var timeDict = {50: Math.round(tdHeight*5/6), 180: Math.round(tdHeight*3)+1,
 120:Math.round(tdHeight*2),75:Math.round(tdHeight*5/4)};

// Used to determine where to start 
var minuteDict = {0: 0, 15 : Math.round(tdHeight/4),
 30:Math.round(tdHeight/2),45:Math.round(tdHeight*3/4) };

// Set height of each td
$("td").each(function() {
	$(this).height(tdHeight);
});

//Function to convert hex format to a rgb color
function rgb2hex(rgb) {
 rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
 return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex(x) {
  return isNaN(x) ? "00" : hexDigits[(x - x % 16) / 16] + hexDigits[x % 16];
 }

// checks whether or not two courses overlap
function doesOverLap(startHour1, startHour2, startMin1, startMin2, duration1, duration2){
	if(startHour1===startHour2 && startMin1===startMin2) {return true;}
	if (startHour1<8){
		startHour1+=12;
	}
	if (startHour2<8){
		startHour2+=12;
	}
	startHour1 += startMin1/60
	startHour2 += startMin2/60
	if (startHour1 < startHour2){
		if (startHour1+duration1/60>startHour2){
			return true;
		}
	} else{
		if (startHour2+duration2/60>startHour1){
			return true;
		}
	}
	return false;
}

// Algorithm idea is get all data from all courses whose background is not white
// redistribute in order (then somehow rearrange colors)
// Collapse all courses left so there are no holes
// I can reverse look up course by the abbreviation which will be in the text
function collapse(){
	var i = 0;
	var currColors = [];
	var currTitles = [];
	// Get the color and the course id of all the current courses
	$('.course').each(function (){
		if (rgb2hex($(this).css("background-color")) !== "#FFF8EB") {
			currColors.push(rgb2hex($(this).css("background-color")));
			currTitles.push($(this).children(".course-id").text());
			$(this).children(".course-delete").remove();
			$(this).children(".course-id").text("");
			$(this).css('background', "#FFF8EB");
		}
		if (++i===count+1){
			return false;
		}
	});
	// Redistribute the classes
	// This is where reverse lookup will eventually happen	
	i = 0;
	$('div.course').each(function (){
		if (i>=currTitles.length){
			return false;
		}
		$(this).children(".course-id").text(currTitles[i]);
		$(this).css('background', currColors[i++]);
		$(this).append("<button id='temp' class='course-delete'>X</button>");
	});
	var i = currColors.length-1;
};

function removeFromPlanner(courseid){
	// Get the course we want to remove
	var course;
	for(var i =0;i<schedule.length;i++){
		if (schedule[i].value === courseid){
			course = schedule[i];
		}
	}
	// create the days we want to place in the array
	var daysArray = [];
	for(var i = 0; i < course.days.length;i++){
		daysArray.push(course.days[i]+parseInt(course.startHour));
	}
	// Remove all of the courses from the planner
	for(var i =0;i<daysArray.length;i++){
		currCourse = "#"+daysArray[i];
		$(currCourse).children(".overflow").text(""); // Give class label
		$(currCourse).children(".overflow").css({'background': "#fff",
			'height': "0px"}); // Set class background color
		//$(currCourse).children(".overflow").removeClass(timeDict[course.duration]);// remove classes
		//$(currCourse).children(".overflow").removeClass(minuteDict[course.startMinute]);
	}
};

// Function for remvoing classes from the class list
$(document).on( "click", ".course-delete",function() {
	var course = $(this).parent();
	if (rgb2hex($(this).css("background-color")) !== "#ffffff"){
		colorArray.push(rgb2hex($(this).css("background-color")));
	}
	$(course).css('background', "#FFF8EB");
	removeFromPlanner($(course).children(".course-id").text());
	$(course).children(".course-id").text("");
	$(this).remove();
	count--; 
	collapse();
});

// Functioned to add classes to the calendar
function addToPlanner(course, color){
	var daysArray = [];
	// Loop to get IDs of each div the class will occupy
	for(var i = 0; i < course.days.length;i++){
		daysArray.push(course.days[i]+parseInt(course.startHour));
	}
	for(var i =0;i<daysArray.length;i++){
		var currCourse = "#"+daysArray[i];
		$(currCourse).children(".overflow").text(course.value); // Give class label
		$(currCourse).children(".overflow").css({'background': color,
			'margin-top': parseInt(minuteDict[course.startMinute]-9)+"px",
			'line-height': parseInt(timeDict[course.duration])+"px"}); // Set class background color
		$(currCourse).children(".overflow").height(timeDict[course.duration]); // Set height of class
		//$(currCourse).children(".overflow").css(minuteDict[course.startMinute]); // Set start height 
	}
};


// HEIGHTS: 41 px for 50 minutes, 150 px for 3 hours, 63px for 1:15, 100px for 2 hours
// Autocomplete definition which handles adding divs for the schedules areas
$(function() {
	$("#tags").autocomplete({
		delay: 200, // Delay for autocomplete (in ms)
		minLength: 2, // Length before autocomplete begings
		source: data, // data source, will eventually come from backend
		open: function() { $('.ui-menu').css('max-width', '27.5%'); },
		focus: function(event, ui) {
					// prevent autocomplete from updating the textbox
					event.preventDefault();
					//this.value = ui.item.label
				},
		select: function (event, ui) { // what happens when we select a course
			var color;
			event.preventDefault(); // don't change what is in the text box
			this.value = ""
			var overLaps = [];
			var overMessage = "";
			if (count > 0){
				for(var i=0;i<schedule.length;i++)
					if (doesOverLap(ui.item.startHour,schedule[i].startHour,ui.item.startMinute,schedule[i].startMinute,ui.item.duration,schedule[i].duration)){
						overLaps.push(i);
						overMessage += schedule[i].value + " ";
				}
				if (overLaps.length > 0){
					overMessage = overMessage.slice(0,-1);
					alert("The class you have selected (" + ui.item.value +") overlaps with the following course(s):" + overMessage + ". Please remove " + overMessage + " in order to add " + ui.item.value + ".");
					return false;
					 /*$(function() {
						$( "#dialog-confirm" ).dialog({
							resizable: false,
							height:140,
							modal: true,
							buttons: {
								"Delete all items": function() {
									$( this ).dialog( "close" );
								},
								Cancel: function() {
									$( this ).dialog( "close" );
								}
							}
						});
					});*/
				}
			}
			if (count < 6) {
				color = colorArray.reverse().pop();
				// Add the course id to the course
				$(".course").eq(count).children(".course-id").text(ui.item.value);
				// Change the background color
				$(".course").eq(count).css('background', color);
				// Add remove course button
				$(".course").eq(count).append("<button id='temp' class='course-delete'><strong>X<strong></button>");
				// Add the class to the schedule
				addToPlanner(ui.item, color);
				// Push the item onto the list of current classes
				schedule.push(ui.item);
				colorArray.reverse(); // get color array back in corrrect order
				count++;
			} else {
				alert("You have selected too many classes! Please remove some before adding more.");
			}
		},
		}) .data("ui-autocomplete")._renderItem = function(ul, item) {
				var $a = $("<a class='ui-item'></a>").text(item.label);
				$("<span class='fr'></span>").text(item.value).prependTo($a);
				$("<small class='db'></small>").text(item.prof).appendTo($a);
				return $("<li></li>").append($a).appendTo(ul);
};
	});


// Data for my autocomplete
var data = [
{ value: 'AFRST101', label: 'Intro Africana Studies', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'N. Westmaas'} ,
{ value: 'AFRST101W', label: 'Intro Africana Studies', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'H. Merrill'} ,
{ value: 'AFRST105', label: 'Blackness Amer Pop Cult', duration:75,days:'mw', startHour:11, startMinute: 00, prof:'C. Thompson'} ,
{ value: 'AFRST160', label: 'History Of Jazz', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'M. Woods'} ,
{ value: 'AFRST208', label: 'Blackness & Masculinity', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'Y. Pak'} ,
{ value: 'AFRST220', label: 'Imagining Africa', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'D. Carter'} ,
{ value: 'AFRST222W', label: 'Race, Gender, & Culture', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Franklin'} ,
{ value: 'AFRST259', label: 'Studies In Jazz', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Woods'} ,
{ value: 'AFRST310W', label: 'Black Womens Exper U.S.', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Haley'} ,
{ value: 'AFRST321', label: 'Haiti And The Caribbean', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'N. Westmaas'} ,
{ value: 'AFRST334', label: 'Queers Of Color', duration:75,days:'mw', startHour:11, startMinute: 00, prof:'Y. Pak'} ,
{ value: 'AFRST435', label: 'Sem Urban Worlds', duration:180,days:'w', startHour:1, startMinute: 00, prof:'D. Carter'} ,
{ value: 'AMST215', label: 'Religion In Film', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'S. Humphries-Brooks'} ,
{ value: 'AMST342', label: 'Sem 20 C Amer Prison Writg', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'D. Larson'} ,
{ value: 'AMST420', label: 'Sem Amer Folk Revivals', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'L. Hamessley'} ,
{ value: 'ANTHR113', label: 'Cultural Anthropology', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'C. Vasantkumar'} ,
{ value: 'ANTHR126', label: 'Lang & Sociolinguistics', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'B. Urciuoli'} ,
{ value: 'ANTHR319', label: 'Freaks,Cyborgs,Monsters,Alien', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'C. Vasantkumar'} ,
{ value: 'ANTHR358W', label: 'History Of Ideas', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'B. Urciuoli, T. Jones'} ,
{ value: 'ARABC115', label: 'First Term Arabic', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'M. Koukjian'} ,
{ value: 'ARABC115', label: 'First Term Arabic', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'M. Koukjian'} ,
{ value: 'ARABC215', label: 'Third Term Arabic', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'M. Koukjian'} ,
{ value: 'ARCH106', label: 'Principles Of Archaeology', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'T. Jones'} ,
{ value: 'ARCH325W', label: 'Analytic Methods Arch.', duration:165,days:'w', startHour:1, startMinute: 00, prof:'N. Goodale'} ,
{ value: 'ART104', label: 'Drawing', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'R. Muirhead'} ,
{ value: 'ART104', label: 'Drawing', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'W. Salzillo'} ,
{ value: 'ART105', label: 'Design', duration:180,days:'r', startHour:1, startMinute: 00, prof:'R. Muirhead'} ,
{ value: 'ART106', label: 'Introduction To Ceramics', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'R. Murtaugh'} ,
{ value: 'ART109', label: 'Introduction To Sculpture', duration:180,days:'t', startHour:1, startMinute: 00, prof:'R. Murtaugh'} ,
{ value: 'ART116', label: 'Intro To Photography', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'R. Knight'} ,
{ value: 'ART116', label: 'Intro To Photography', duration:180,days:'r', startHour:1, startMinute: 00, prof:'R. Knight'} ,
{ value: 'ART160', label: 'Figure Drawing', duration:180,days:'t', startHour:1, startMinute: 00, prof:'K. Kuharic'} ,
{ value: 'ART203', label: 'Introduction To Painting', duration:180,days:'m', startHour:1, startMinute: 00, prof:'W. Salzillo'} ,
{ value: 'ART213', label: 'Introduction To Video', duration:180,days:'t', startHour:1, startMinute: 00, prof:'L. Gant'} ,
{ value: 'ART213', label: 'Introduction To Video', duration:180,days:'w', startHour:1, startMinute: 00, prof:'L. Gant'} ,
{ value: 'ART235', label: 'Intaglio Printmaking', duration:180,days:'f', startHour:1, startMinute: 00, prof:'R. Muirhead'} ,
{ value: 'ART302', label: 'Advanced Photography', duration:180,days:'f', startHour:1, startMinute: 00, prof:'R. Knight'} ,
{ value: 'ART304', label: 'Advanced Painting', duration:180,days:'w', startHour:1, startMinute: 00, prof:'K. Kuharic'} ,
{ value: 'ART313', label: 'Advanced Video', duration:180,days:'m', startHour:1, startMinute: 00, prof:'L. Gant'} ,
{ value: 'ART501', label: 'Senior Project', duration:180,days:'w', startHour:4, startMinute: 00, prof:'L. Gant, R. Murtaugh, K. Kuharic, R. K (more)'} ,
{ value: 'ARTH120', label: 'Intro Hist & Theory Film', duration:180,days:'t', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'ARTH150W', label: 'Architecture In History', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'R. Carter'} ,
{ value: 'ARTH152W', label: 'Proseminar Art History', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'J. McEnroe'} ,
{ value: 'ARTH154', label: 'Art And Cultures Of Asia', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Goldberg'} ,
{ value: 'ARTH258', label: 'Chinese Art', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Goldberg'} ,
{ value: 'ARTH259', label: 'Defining American Art', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'D. Pokinski'} ,
{ value: 'ARTH285', label: '17Th Century Art', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'R. Carter'} ,
{ value: 'ARTH290', label: 'Hist Documentary Cinema', duration:180,days:'m', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'ARTH293', label: 'Modernism Into Contemp Art', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'D. Pokinski'} ,
{ value: 'ARTH297W', label: 'World Arch 20Th Century', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'L. Chua'} ,
{ value: 'ARTH330W', label: 'Theory Methods Art Hist', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'J. McEnroe'} ,
{ value: 'ARTH359', label: 'North Amer Architecture', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Carter'} ,
{ value: 'ASNST180W', label: 'Explore Cult Cities Asia', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'L. Trivedi'} ,
{ value: 'ASNST180W', label: 'Explore Cult Cities Asia', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'T. Wilson'} ,
{ value: 'BICHM320', label: 'Biophysical Chemistry', duration:75,days:'mf', startHour:1, startMinute: 00, prof:'M. Cotten'} ,
{ value: 'BICHM321', label: 'Physical Chemistry I', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'A. Van Wynsberghe'} ,
{ value: 'BICHM321L', label: 'Physical Chemistry Lab', duration:180,days:'m', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'BICHM346', label: 'Biochemistry', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'W. Chang'} ,
{ value: 'BICHM550', label: 'Senior Thesis I', duration:120,days:'f', startHour:3, startMinute: 00, prof:'M. Cotten'} ,
{ value: 'BICHM550', label: 'Senior Thesis I', duration:120,days:'f', startHour:3, startMinute: 00, prof:'W. Chang'} ,
{ value: 'BICHM550', label: 'Senior Thesis I', duration:120,days:'f', startHour:3, startMinute: 00, prof:'H. Lehman'} ,
{ value: 'BICHM550', label: 'Senior Thesis I', duration:120,days:'f', startHour:3, startMinute: 00, prof:'M. McCormick'} ,
{ value: 'BICHM550', label: 'Senior Thesis I', duration:120,days:'f', startHour:3, startMinute: 00, prof:'J. Garrett'} ,
{ value: 'BIO101', label: 'Gen Bio:Genetics&Evolutn', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'J. Garrett, H. Cramer, C. Tome'} ,
{ value: 'BIO101', label: 'Gen Bio:Genetics&Evolutn', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'J. Garrett, H. Cramer, C. Tome'} ,
{ value: 'BIO101L', label: 'Gen Bio:Genetic&Evol Lab', duration:180,days:'m', startHour:1, startMinute: 00, prof:'H. Cramer, C. Tome'} ,
{ value: 'BIO101L', label: 'Gen Bio:Genetic&Evol Lab', duration:180,days:'t', startHour:9, startMinute: 00, prof:'H. Cramer, C. Tome'} ,
{ value: 'BIO101L', label: 'Gen Bio:Genetic&Evol Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'H. Cramer, C. Tome'} ,
{ value: 'BIO101L', label: 'Gen Bio:Genetic&Evol Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'H. Cramer, C. Tome'} ,
{ value: 'BIO101L', label: 'Gen Bio:Genetic&Evol Lab', duration:180,days:'r', startHour:1, startMinute: 00, prof:'H. Cramer, C. Tome'} ,
{ value: 'BIO115', label: 'Fundamentals & Frontiers', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'S. Miller'} ,
{ value: 'BIO115L', label: 'Fundamental&Frontiers Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'S. Miller'} ,
{ value: 'BIO115L', label: 'Fundamental&Frontiers Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'S. Miller'} ,
{ value: 'BIO150', label: 'Environmental Sci & Society', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'C. Dash'} ,
{ value: 'BIO215', label: 'Genetics And Society', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Garrett'} ,
{ value: 'BIO237', label: 'Ecology', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'BIO237', label: 'Ecology', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'BIO240W', label: 'Plant Diversity', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'W. Pfitsch'} ,
{ value: 'BIO290', label: 'Paleontology', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'C. Domack'} ,
{ value: 'BIO333', label: 'Vertebrate Developmnt', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Miller'} ,
{ value: 'BIO346', label: 'Biochemistry', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'W. Chang'} ,
{ value: 'BIO352', label: 'Scanning Etron Microscopy', duration:120,days:'m', startHour:1, startMinute: 00, prof:'K. Bart'} ,
{ value: 'BIO352', label: 'Scanning Etron Microscopy', duration:120,days:'m', startHour:1, startMinute: 00, prof:'K. Bart'} ,
{ value: 'BIO355', label: 'Microbial Ecology', duration:180,days:'r', startHour:1, startMinute: 00, prof:'M. McCormick'} ,
{ value: 'BIO357', label: 'Cellular Neurobiology', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'H. Lehman'} ,
{ value: 'BIO449', label: 'Sem Animal-Plant Interactions', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'H. Mallory'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'H. Mallory'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'W. Pfitsch'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'W. Chang'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'H. Lehman'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'J. Garrett'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'M. McCormick'} ,
{ value: 'BIO550', label: 'Senior Thesis I', duration:60,days:'m', startHour:3, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120', label: 'Principles Of Chemistry', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'K. Brewer'} ,
{ value: 'CHEM120', label: 'Principles Of Chemistry', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120L', label: 'Prin. Chem. Lab', duration:180,days:'m', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120L', label: 'Prin. Chem. Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120L', label: 'Prin. Chem. Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120L', label: 'Prin. Chem. Lab', duration:180,days:'r', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM120L', label: 'Prin. Chem. Lab', duration:180,days:'r', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255', label: 'Organic Chemistry Ii', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255', label: 'Organic Chemistry Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255L', label: 'Organic Chem Ii Lab', duration:240,days:'m', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255L', label: 'Organic Chem Ii Lab', duration:-480,days:'t', startHour:12, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255L', label: 'Organic Chem Ii Lab', duration:240,days:'w', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM255L', label: 'Organic Chem Ii Lab', duration:-480,days:'r', startHour:12, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM320', label: 'Biophysical Chemistry', duration:75,days:'mf', startHour:1, startMinute: 00, prof:'M. Cotten'} ,
{ value: 'CHEM321', label: 'Physical Chemistry I', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'A. Van Wynsberghe'} ,
{ value: 'CHEM321L', label: 'Physical Chemistry Lab', duration:180,days:'m', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHEM360W', label: 'Org Synthesis Human Health', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'M. Majireck'} ,
{ value: 'CHEM371W', label: 'Research Methods In Chem', duration:50,days:'t', startHour:12, startMinute: 00, prof:'K. Brewer, R. Kinnel'} ,
{ value: 'CHEM551', label: 'Senior Project', duration:210,days:'f', startHour:2, startMinute: 30, prof:'M. Majireck'} ,
{ value: 'CHNSE110', label: 'First Term Chinese', duration:50,days:'mw', startHour:12, startMinute: 00, prof:'X. Hou, Y. Li, S. Wu'} ,
{ value: 'CHNSE110', label: 'First Term Chinese', duration:50,days:'mw', startHour:12, startMinute: 00, prof:'X. Hou, Y. Li, S. Wu'} ,
{ value: 'CHNSE110', label: 'First Term Chinese', duration:50,days:'mw', startHour:9, startMinute: 00, prof:'X. Hou, Y. Li, S. Wu'} ,
{ value: 'CHNSE110', label: 'First Term Chinese', duration:50,days:'mw', startHour:1, startMinute: 00, prof:'X. Hou, Y. Li, S. Wu'} ,
{ value: 'CHNSE130', label: 'Third Term Chinese', duration:50,days:'wf', startHour:10, startMinute: 00, prof:'L. Xue, Y. Li, Z. Wang'} ,
{ value: 'CHNSE130', label: 'Third Term Chinese', duration:50,days:'wf', startHour:11, startMinute: 00, prof:'L. Xue, Y. Li, Z. Wang'} ,
{ value: 'CHNSE130', label: 'Third Term Chinese', duration:70,days:'w', startHour:2, startMinute: 30, prof:'L. Xue, Y. Li, Z. Wang'} ,
{ value: 'CHNSE150', label: 'Chnse Culture & Lang.', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHNSE200', label: 'Advanced Chinese I', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'CHNSE210', label: 'Modern Chinese Literature', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'TBA'} ,
{ value: 'CHNSE400', label: 'Changing Face Of China', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'X. Hou'} ,
{ value: 'CHNSE425W', label: 'Current Issues China', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'L. Xue'} ,
{ value: 'CHNSE445', label: 'Classcl Chnse Lang & Cult', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'CHNSE450W', label: 'Chnse Rev Through Film', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'Z. Wang'} ,
{ value: 'CLASC110', label: 'Civ Greece & Near East', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Feltovich'} ,
{ value: 'CLASC201', label: 'Hist West Phil (Anc)', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Werner'} ,
{ value: 'CLASC201W', label: 'Hist Western Phil (Anc)', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Werner'} ,
{ value: 'CLASC240', label: 'Classical Mythology', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'CLASC242', label: 'Clasc Trad U.S. Pol Life', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'C. Rubino, F. Anechiarico'} ,
{ value: 'CLASC244W', label: 'Tragedy:Then And Now', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'N. Rabinowitz'} ,
{ value: 'CLASC360W', label: 'Film And The Classics', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'C. Rubino'} ,
{ value: 'CLNG107', label: 'First Term Modern Hebrew', duration:70,days:'mwf', startHour:1, startMinute: 30, prof:'A. Guez'} ,
{ value: 'CLNG207', label: 'Third Term Hebrew', duration:70,days:'mwf', startHour:2, startMinute: 30, prof:'A. Guez'} ,
{ value: 'CNMS120', label: 'Intro Hist & Theory Film', duration:180,days:'t', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'CNMS290', label: 'Hist Documentary Cinema', duration:180,days:'m', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'CNMS317', label: 'The Laws Of Cool', duration:75,days:'tr', startHour:2, startMinute: 30, prof:"P. O'Neill"} ,
{ value: 'COLEG210', label: 'Leadership:Theory&Practic', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Mason'} ,
{ value: 'COLEG220', label: 'Cult&Nat Hist Adirondack Park', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'O. Oerlemans'} ,
{ value: 'COLEG235', label: 'Food For Thought', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'F. Sciacca'} ,
{ value: 'COMM101', label: 'Intro To Communication', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'C. Phelan'} ,
{ value: 'COMM203', label: 'Hist Of Communication', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'C. Ceisel'} ,
{ value: 'COMM222', label: 'Interpersonal Communication', duration:75,days:'mw', startHour:8, startMinute: 30, prof:'M. Dowd'} ,
{ value: 'COMM302', label: 'Communication Theory', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'C. Phelan'} ,
{ value: 'COMM303', label: 'Risk&Crisis Communicatn', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'M. Dowd'} ,
{ value: 'COMM365', label: 'Persuasion', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Dowd'} ,
{ value: 'COMM380', label: 'Soc Hist Advertising', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'C. Ceisel'} ,
{ value: 'COMM455', label: 'Method Communcatn Research', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'C. Phelan'} ,
{ value: 'CPLIT120', label: 'Intro Hist & Theory Film', duration:180,days:'t', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'CPLIT211W', label: 'Intro. World Lit. I', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'A. Mescall'} ,
{ value: 'CPLIT225W', label: 'Madness, Murder, Mayhem', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Bartle'} ,
{ value: 'CPLIT244W', label: 'Tragedy:Then And Now', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'N. Rabinowitz'} ,
{ value: 'CPLIT289W', label: 'Intro Arabic Literature', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Mescall'} ,
{ value: 'CPLIT290', label: 'Hist Documentary Cinema', duration:180,days:'m', startHour:7, startMinute: 00, prof:'S. MacDonald'} ,
{ value: 'CPLIT356', label: 'Intro To Japanese Film', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'K. Omori'} ,
{ value: 'CPLIT500', label: 'Sr Sem:Adoration & Theft', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'P. Rabinowitz'} ,
{ value: 'CPSCI110', label: 'Intro Computer Science', duration:50,days:'m', startHour:12, startMinute: 00, prof:'S. Hirshfield'} ,
{ value: 'CPSCI111', label: 'Data Structures', duration:75,days:'mwf', startHour:2, startMinute: 30, prof:'A. Campbell'} ,
{ value: 'CPSCI210', label: 'Applied Theory', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'R. Decker'} ,
{ value: 'CPSCI240', label: 'Computer Organization', duration:75,days:'mwf', startHour:1, startMinute: 00, prof:'A. Campbell'} ,
{ value: 'CPSCI290', label: 'Programming Challenges', duration:120,days:'w', startHour:4, startMinute: 00, prof:'A. Campbell, R. Decker'} ,
{ value: 'CPSCI310', label: 'Compilers', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'A. Campbell'} ,
{ value: 'CPSCI410', label: 'Senior Seminar', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Decker'} ,
{ value: 'DANCE114', label: 'Elementary Ballet', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'P. Wilcox'} ,
{ value: 'DANCE205', label: 'Kinesiology', duration:75,days:'wf', startHour:2, startMinute: 30, prof:'B. Walczyk'} ,
{ value: 'DANCE208', label: 'Martial Arts & Dance', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'B. Walczyk'} ,
{ value: 'DANCE215', label: 'Intermediate Ballet', duration:75,days:'mwf', startHour:11, startMinute: 00, prof:'S. Stanton-Cotter'} ,
{ value: 'DANCE216', label: 'Intermediate Jazz Dance', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'E. Heekin'} ,
{ value: 'DANCE250W', label: 'Ballet In 20Th Century', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'P. Wilcox'} ,
{ value: 'DANCE307', label: 'Choreography', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'E. Heekin, B. Walczyk'} ,
{ value: 'ECON101', label: 'Issues In Microeconomics', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'E. Conover'} ,
{ value: 'ECON101', label: 'Issues In Microeconomics', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'E. Conover'} ,
{ value: 'ECON101', label: 'Issues In Microeconomics', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'ECON101', label: 'Issues In Microeconomics', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'TBA'} ,
{ value: 'ECON101', label: 'Issues In Microeconomics', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'TBA'} ,
{ value: 'ECON102', label: 'Issues In Macroeconomics', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'D. Barth'} ,
{ value: 'ECON102', label: 'Issues In Macroeconomics', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'D. Barth'} ,
{ value: 'ECON230', label: 'Accounting', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'S. Owen'} ,
{ value: 'ECON265', label: 'Economic Statistics', duration:75,days:'mf', startHour:1, startMinute: 00, prof:'P. Hagstrom'} ,
{ value: 'ECON265', label: 'Economic Statistics', duration:75,days:'mf', startHour:1, startMinute: 00, prof:'P. Hagstrom'} ,
{ value: 'ECON275', label: 'Microeconomic Theory', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Wu'} ,
{ value: 'ECON275', label: 'Microeconomic Theory', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'S. Wu'} ,
{ value: 'ECON285', label: 'Macroeconomic Theory', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'C. Georges'} ,
{ value: 'ECON285', label: 'Macroeconomic Theory', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'C. Georges'} ,
{ value: 'ECON325W', label: 'Comp Economic Systems', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'D. Jones'} ,
{ value: 'ECON325W', label: 'Comp Economic Systems', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'D. Jones'} ,
{ value: 'ECON348', label: 'Econ Social Responsibility', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'J. Videras'} ,
{ value: 'ECON400', label: 'Econometrics', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'J. Pliskin'} ,
{ value: 'ECON400', label: 'Econometrics', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'J. Pliskin'} ,
{ value: 'ECON435', label: 'Industrial Organizatn', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'E. Jensen'} ,
{ value: 'ECON446', label: 'Policy', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'A. Owen'} ,
{ value: 'ECON460', label: 'Game Theory & Econ Behavior', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'C. Georges'} ,
{ value: 'ECON503', label: 'Hr Management Practices', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'J. Pliskin'} ,
{ value: 'ECON508', label: 'Topic Industrial Organization', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'E. Jensen'} ,
{ value: 'EDUC200', label: 'Issues In Education', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Mason'} ,
{ value: 'EDUC201', label: 'Methods Tutoring Esol Student', duration:50,days:'w', startHour:12, startMinute: 00, prof:'B. Britt-Hysell'} ,
{ value: 'EDUC220', label: 'Sign Lang&Deaf Culture 1', duration:180,days:'t', startHour:6, startMinute: 00, prof:'V. Allen'} ,
{ value: 'EDUC350', label: 'Ethnography Learning Env', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'S. Mason'} ,
{ value: 'ENCRW215', label: 'Intro Creative Writg.', duration:150,days:'tr', startHour:10, startMinute: 30, prof:'H. Ngo'} ,
{ value: 'ENCRW215', label: 'Intro Creative Writg.', duration:150,days:'tr', startHour:2, startMinute: 30, prof:'H. Ngo'} ,
{ value: 'ENCRW304', label: 'Inter Cw: Poetry', duration:-570,days:'tr', startHour:12, startMinute: 45, prof:'N. Guttman'} ,
{ value: 'ENCRW305', label: 'Inter Cw: Fiction', duration:150,days:'mw', startHour:2, startMinute: 30, prof:'D. Larson'} ,
{ value: 'ENCRW498', label: 'Honors Proj Creative Writg', duration:180,days:'m', startHour:1, startMinute: 00, prof:'J. Springer'} ,
{ value: 'ENGL204W', label: 'Poetry & Poetics', duration:75,days:'mw', startHour:8, startMinute: 30, prof:'J. Springer'} ,
{ value: 'ENGL204W', label: 'Poetry & Poetics', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'N. Guttman'} ,
{ value: 'ENGL205', label: 'The Study Of The Novel', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'C. Gannon'} ,
{ value: 'ENGL222W', label: 'Chaucer:Gender & Genre', duration:70,days:'mwf', startHour:2, startMinute: 30, prof:'K. Terrell'} ,
{ value: 'ENGL225', label: 'Shakespeare', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'N. Strout'} ,
{ value: 'ENGL252', label: 'Romanticism & Realism', duration:75,days:'tr', startHour:9, startMinute: 00, prof: "P. O'Neill"} ,
{ value: 'ENGL255', label: 'Marrow African-Amer Lit', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'V. Odamtten'} ,
{ value: 'ENGL266', label: 'U.S. Modernisms', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'B. Widiss'} ,
{ value: 'ENGL267', label: 'Literature & Environment', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'O. Oerlemans'} ,
{ value: 'ENGL315W', label: 'Literary Theory And Study', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'B. Widiss'} ,
{ value: 'ENGL317', label: 'The Laws Of Cool', duration:75,days:'tr', startHour:2, startMinute: 30, prof:"P. O'Neill"} ,
{ value: 'ENGL330W', label: 'Comedy&Tragedy:1580-1780', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'N. Strout'} ,
{ value: 'ENGL342', label: 'Sem 20 C Amer Prison Writg', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'D. Larson'} ,
{ value: 'ENGL353W', label: 'Anglo-American Modernism', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'S. Yao'} ,
{ value: 'ENGL435', label: 'Sem Jane Austen:Text&Film', duration:75,days:'mw', startHour:2, startMinute: 30, prof:"J. O'Neill"} ,
{ value: 'ENVST150', label: 'Environmental Sci & Society', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'C. Dash'} ,
{ value: 'ENVST220', label: 'Cult&Nat Hist Adirondack Park', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'O. Oerlemans'} ,
{ value: 'ENVST250', label: 'Interpreting Amer Environment', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Winkelman'} ,
{ value: 'FRNCH110', label: 'First Term French', duration:50,days:'mtwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'FRNCH110', label: 'First Term French', duration:50,days:'mtwf', startHour:12, startMinute: 00, prof:'TBA'} ,
{ value: 'FRNCH130', label: 'Intermediate French I', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'P. Diaz'} ,
{ value: 'FRNCH130', label: 'Intermediate French I', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'P. Diaz'} ,
{ value: 'FRNCH140', label: 'Intermediate French Ii', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:"J. O'Neal"} ,
{ value: 'FRNCH140', label: 'Intermediate French Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:"J. O'Neal"} ,
{ value: 'FRNCH200W', label: 'Intro French Studies', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'C. Morgan'} ,
{ value: 'FRNCH200W', label: 'Intro French Studies', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'C. Morgan'} ,
{ value: 'FRNCH211W', label: 'Intro French Lit I', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'TBA'} ,
{ value: 'FRNCH280', label: 'Francophone Cultures', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'J. Mwantuali'} ,
{ value: 'FRNCH408', label: 'Passions Of The Soul', duration:75,days:'mw', startHour:1, startMinute: 00, prof:"J. O'Neal"} ,
{ value: 'FRNCH455', label: 'The African Novel', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Mwantuali'} ,
{ value: 'GEOSC101', label: 'Earth Resources & Envir', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'D. Bailey'} ,
{ value: 'GEOSC110', label: 'Environmental Geology', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'T. Rayne'} ,
{ value: 'GEOSC211', label: 'Sedimentary Geology', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'B. Hough'} ,
{ value: 'GEOSC220', label: 'Mineralogy', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'D. Bailey'} ,
{ value: 'GEOSC240', label: 'Meteorology', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'C. Domack'} ,
{ value: 'GEOSC290', label: 'Paleontology', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'C. Domack'} ,
{ value: 'GEOSC309', label: 'Adv Hydrogeology & Envir', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'T. Rayne'} ,
{ value: 'GEOSC352', label: 'Scanning Etron Microscopy', duration:120,days:'m', startHour:1, startMinute: 00, prof:'K. Bart'} ,
{ value: 'GEOSC352', label: 'Scanning Etron Microscopy', duration:120,days:'m', startHour:1, startMinute: 00, prof:'K. Bart'} ,
{ value: 'GERMN110', label: 'First Term German', duration:50,days:'mwrf', startHour:12, startMinute: 00, prof:'J. Malloy'} ,
{ value: 'GERMN130', label: 'Third Term German', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'J. Malloy'} ,
{ value: 'GERMN200W', label: 'Topic Adv Reading & Writg', duration:75,days:'wf', startHour:2, startMinute: 30, prof:'J. Malloy'} ,
{ value: 'GERMN420', label: '20Th Century German Lit', duration:180,days:'m', startHour:1, startMinute: 00, prof:'F. Bergmann'} ,
{ value: 'GOVT112', label: 'Comparative Politics', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'O. Olarinmoye'} ,
{ value: 'GOVT112', label: 'Comparative Politics', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'O. Olarinmoye'} ,
{ value: 'GOVT114W', label: 'International Relations', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'E. De Bruin'} ,
{ value: 'GOVT114W', label: 'International Relations', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'E. De Bruin'} ,
{ value: 'GOVT116W', label: 'Amer Political Process', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'G. Johnson'} ,
{ value: 'GOVT116W', label: 'Amer Political Process', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'G. Johnson'} ,
{ value: 'GOVT117W', label: 'Intro Political Theory', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'R. Martin'} ,
{ value: 'GOVT211', label: 'Politics In China', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'C. Lee'} ,
{ value: 'GOVT216', label: 'Politics Latin America', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'H. Sullivan'} ,
{ value: 'GOVT230', label: 'Data Analysis', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'P. Wyckoff'} ,
{ value: 'GOVT242', label: 'Clasc Trad U.S. Pol Life', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'F. Anechiarico, C. Rubino'} ,
{ value: 'GOVT251', label: 'Intro Public Policy', duration:75,days:'mw', startHour:8, startMinute: 30, prof:'F. Anechiarico'} ,
{ value: 'GOVT287', label: 'Pol Theory & The Environment', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'J. Winkelman'} ,
{ value: 'GOVT290', label: 'U.S. Foreign Policy', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'A. Cafruny'} ,
{ value: 'GOVT291', label: 'International Pol Economy', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Cafruny'} ,
{ value: 'GOVT329W', label: 'Authoritarian Politics', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'C. Lee'} ,
{ value: 'GOVT365W', label: 'Free Speech', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Martin'} ,
{ value: 'GOVT394W', label: 'Soc Movements & Pol Protest', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'H. Sullivan'} ,
{ value: 'GOVT549', label: 'Honors Seminar', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'F. Anechiarico'} ,
{ value: 'GOVT549', label: 'Honors Seminar', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Rivera'} ,
{ value: 'GREEK120', label: 'Elementary Greek Ii', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'A. Feltovich'} ,
{ value: 'GREEK390', label: 'Topic: Tba', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'HIST102W', label: 'Atlantic World Slave Trade', duration:75,days:'mw', startHour:8, startMinute: 30, prof:'R. Paquette'} ,
{ value: 'HIST104W', label: 'Europe & Empires, 1500-2000', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'K. Grant'} ,
{ value: 'HIST109W', label: 'Early Mod Western Europe', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'D. Ambrose'} ,
{ value: 'HIST117W', label: 'Europe Since 1815', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Kelly'} ,
{ value: 'HIST180W', label: 'Explor Cult Cities Asia', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'L. Trivedi, T. Wilson'} ,
{ value: 'HIST180W', label: 'Explor Cult Cities Asia', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'T. Wilson, L. Trivedi'} ,
{ value: 'HIST202', label: 'Early Middle Ages', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'J. Eldevik'} ,
{ value: 'HIST210', label: 'Intro U.S. Hist: 1492-1861', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'D. Ambrose'} ,
{ value: 'HIST212', label: 'Germany,1789-Present', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'A. Kelly'} ,
{ value: 'HIST214', label: 'Revolutions', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'R. Paquette'} ,
{ value: 'HIST215', label: 'The American Civil War', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'M. Isserman'} ,
{ value: 'HIST221', label: 'Early Russian Hist', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'S. Keller'} ,
{ value: 'HIST225', label: 'History European Thought', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Kelly'} ,
{ value: 'HIST235', label: 'Women In Modern Asia', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'L. Trivedi'} ,
{ value: 'HIST256', label: 'Islam Modernity S Asia', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'A. Amar'} ,
{ value: 'HIST280', label: 'Ming-Qing China', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'T. Wilson'} ,
{ value: 'HIST326W', label: 'Rebels And Radicals', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'J. Eldevik'} ,
{ value: 'HIST341W', label: 'American Colonial Hist', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'D. Ambrose'} ,
{ value: 'HIST345W', label: 'Ussr As Mulinational', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Keller'} ,
{ value: 'HIST387W', label: 'International Government', duration:180,days:'t', startHour:1, startMinute: 00, prof:'K. Grant'} ,
{ value: 'HIST396W', label: 'Sem History Of Gods', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'T. Wilson'} ,
{ value: 'HIST401W', label: 'Research Sem In Hist', duration:180,days:'f', startHour:1, startMinute: 00, prof:'J. Eldevik'} ,
{ value: 'HSPST110', label: 'First Term Spanish', duration:50,days:'mtwr', startHour:9, startMinute: 00, prof:'M. Portal'} ,
{ value: 'HSPST115', label: 'Spanish Immersion I', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'TBA'} ,
{ value: 'HSPST130', label: 'Third Term Spanish', duration:50,days:'mtwr', startHour:11, startMinute: 00, prof:'TBA'} ,
{ value: 'HSPST130', label: 'Third Term Spanish', duration:50,days:'mtwr', startHour:12, startMinute: 00, prof:'TBA'} ,
{ value: 'HSPST140', label: 'Conversatn Hispanic Cult', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'HSPST140', label: 'Conversatn Hispanic Cult', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'M. Willstedt'} ,
{ value: 'HSPST140', label: 'Conversatn Hispanic Cult', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'M. Willstedt'} ,
{ value: 'HSPST200W', label: 'Exploring Hispanic Texts', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Hwangpo'} ,
{ value: 'HSPST200W', label: 'Exploring Hispanic Texts', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'X. Tubau Moreu'} ,
{ value: 'HSPST200W', label: 'Exploring Hispanic Texts', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'X. Tubau Moreu'} ,
{ value: 'HSPST201', label: 'Heritage/Bilingual Speakers', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'HSPST211', label: 'Intro Latin Amer Lit', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'J. Burke'} ,
{ value: 'HSPST213', label: 'Ficciones Del Delito', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'M. Hwangpo'} ,
{ value: 'HSPST250', label: 'Journey Span Culture', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'X. Tubau Moreu'} ,
{ value: 'HSPST343', label: 'Contemp Latin Amer Novel', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'J. Burke'} ,
{ value: 'HSPST380', label: 'Cervantes Don Quijote', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'J. Medina'} ,
{ value: 'HSPST400', label: 'Topic:El Cid Campeador', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'M. Willstedt'} ,
{ value: 'ITALN110', label: 'First Term Italian', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'TBA'} ,
{ value: 'ITALN110', label: 'First Term Italian', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'TBA'} ,
{ value: 'ITALN110', label: 'First Term Italian', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'M. Sisler'} ,
{ value: 'ITALN130', label: 'Third Term Italian', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'M. Sisler'} ,
{ value: 'ITALN200', label: 'Intro Italian Lit & Culture', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'M. Sisler'} ,
{ value: 'JAPN110', label: 'First Term Japanese', duration:50,days:'mw', startHour:11, startMinute: 00, prof:'M. Kamiya, Y. Naito'} ,
{ value: 'JAPN110', label: 'First Term Japanese', duration:50,days:'mw', startHour:12, startMinute: 00, prof:'M. Kamiya, Y. Naito'} ,
{ value: 'JAPN130', label: 'Third Term Japanese', duration:50,days:'mw', startHour:10, startMinute: 00, prof:'Y. Naito'} ,
{ value: 'JAPN200', label: 'Advanced Japanese I', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'Y. Naito'} ,
{ value: 'JAPN356', label: 'Intro To Japanese Film', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'K. Omori'} ,
{ value: 'JAPN401', label: 'Readings In Japanese', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'K. Omori'} ,
{ value: 'LATIN110', label: 'Elementary Latin I', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'S. Haley'} ,
{ value: 'LATIN210', label: 'World Of Ancient Rome', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'B. Gold'} ,
{ value: 'LATIN390', label: 'Topic: Medieval Latin', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'B. Gold'} ,
{ value: 'LING100', label: 'Intro To Linguistics', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Kamiya'} ,
{ value: 'MATH113', label: 'Calculus I', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'J. Wiscons'} ,
{ value: 'MATH113', label: 'Calculus I', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Dykstra'} ,
{ value: 'MATH113', label: 'Calculus I', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'J. Wiscons'} ,
{ value: 'MATH116', label: 'Calculus Ii', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'C. Gibbons'} ,
{ value: 'MATH116', label: 'Calculus Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'C. Gibbons'} ,
{ value: 'MATH116', label: 'Calculus Ii', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'S. Cockburn'} ,
{ value: 'MATH116', label: 'Calculus Ii', duration:70,days:'mwf', startHour:1, startMinute: 10, prof:'T. Wiscons'} ,
{ value: 'MATH216', label: 'Multivariable Calculus', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'M. LeMasurier'} ,
{ value: 'MATH216', label: 'Multivariable Calculus', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'M. LeMasurier'} ,
{ value: 'MATH216', label: 'Multivariable Calculus', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'A. Dykstra'} ,
{ value: 'MATH224W', label: 'Linear Algebra *Wi', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'S. Cockburn'} ,
{ value: 'MATH224W', label: 'Linear Algebra *Wi', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'L. Knop'} ,
{ value: 'MATH235', label: 'Differential Equations', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'M. LeMasurier'} ,
{ value: 'MATH253', label: 'Stat Analysis Of Data', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'C. Kuruwita'} ,
{ value: 'MATH253', label: 'Stat Analysis Of Data', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'C. Kuruwita'} ,
{ value: 'MATH314W', label: 'Real Analysis', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'R. Kantrowitz'} ,
{ value: 'MATH325W', label: 'Modern Algebra', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'C. Gibbons'} ,
{ value: 'MATH351', label: 'Probability Theory', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'T. Kelly'} ,
{ value: 'MATH437', label: 'Sr Sem: Algebra', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Wiscons'} ,
{ value: 'MATH437', label: 'Sr Sem Statistics', duration:50,days:'mwf', startHour:1, startMinute: 00, prof:'C. Kuruwita'} ,
{ value: 'MATH437', label: 'Sr Sem:Phil Foundatn Math', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Cockburn'} ,
{ value: 'MATH437', label: 'Sr Sem: Dynamics', duration:75,days:'mw', startHour:11, startMinute: 00, prof:'A. Dykstra'} ,
{ value: 'MATH437', label: 'Sr Sem:Applied Statistics', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'T. Kelly'} ,
{ value: 'MUSIC109', label: 'Fundamentl Theories Music', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'R. Hopkins'} ,
{ value: 'MUSIC141', label: 'Choir', duration:120,days:'mw', startHour:7, startMinute: 00, prof:'G. Kolb'} ,
{ value: 'MUSIC141', label: 'Brass Lab', duration:80,days:'mw', startHour:5, startMinute: 30, prof:'H. Buchman, J. Raschella'} ,
{ value: 'MUSIC141', label: 'Orchestra', duration:120,days:'tr', startHour:7, startMinute: 00, prof:'H. Buchman, U. Valli'} ,
{ value: 'MUSIC141', label: 'Jazz Ensemble', duration:110,days:'tr', startHour:4, startMinute: 00, prof:'M. Woods'} ,
{ value: 'MUSIC141', label: 'Jazz Improvisation', duration:90,days:'w', startHour:4, startMinute: 00, prof:'M. Woods'} ,
{ value: 'MUSIC160', label: 'History Of Jazz', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'M. Woods'} ,
{ value: 'MUSIC180', label: 'Basic Aural Skills', duration:50,days:'tf', startHour:12, startMinute: 00, prof:'L. Hamessley'} ,
{ value: 'MUSIC209', label: 'Counterpoint & Harmony', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'R. Hopkins'} ,
{ value: 'MUSIC216', label: 'Conducting', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'G. Kolb'} ,
{ value: 'MUSIC241', label: 'College Hill Singers', duration:50,days:'mw', startHour:12, startMinute: 00, prof:'G. Kolb'} ,
{ value: 'MUSIC251', label: 'Music Europe Before 1600', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'L. Hamessley'} ,
{ value: 'MUSIC259', label: 'Studies In Jazz', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Woods'} ,
{ value: 'MUSIC277', label: 'Music Contemporary Media', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'S. Pellman'} ,
{ value: 'MUSIC350', label: 'Topics In Music', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'L. Hamessley, S. Pellman, M. Woods'} ,
{ value: 'MUSIC420', label: 'Sem Amer Folk Revivals', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'L. Hamessley'} ,
{ value: 'NEURO201', label: 'Stats & Research Methods', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'T. McKee'} ,
{ value: 'NEURO204', label: 'Human Neuropsychology', duration:70,days:'mwf', startHour:2, startMinute: 30, prof:'R. Thiruchselvam'} ,
{ value: 'NEURO205', label: 'Intro Brain & Behavior', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'D. Weldon'} ,
{ value: 'NEURO328', label: 'Cognitiive Neuroscience', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'A. List'} ,
{ value: 'NEURO328L', label: 'Cognitive Neurosci Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'A. List'} ,
{ value: 'NEURO328L', label: 'Cognitive Neurosci Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'A. List'} ,
{ value: 'NEURO357', label: 'Cellular Neurobiology', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'H. Lehman'} ,
{ value: 'NEURO500', label: 'Senior Project', duration:50,days:'t', startHour:12, startMinute: 00, prof:'J. Vaughan'} ,
{ value: 'ORCOM210', label: 'Rhetorical Act', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Helmer'} ,
{ value: 'ORCOM210', label: 'Rhetorical Act', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'J. Helmer'} ,
{ value: 'PHIL117W', label: 'Intro Political Theory', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'R. Martin'} ,
{ value: 'PHIL119', label: 'Life And Death', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'D. Edwards'} ,
{ value: 'PHIL200', label: 'Critical Reasoning', duration:75,days:'wf', startHour:2, startMinute: 30, prof:'K. Doran'} ,
{ value: 'PHIL201', label: 'Hist Western Phil (Anc)', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Werner'} ,
{ value: 'PHIL201W', label: 'Hist Western Phil (Anc)', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Werner'} ,
{ value: 'PHIL221', label: 'Food And Philosophy', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'A. Plakias'} ,
{ value: 'PHIL222W', label: 'Race,Gender,&Culture', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Franklin'} ,
{ value: 'PHIL240', label: 'Symbolic Logic', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'R. Marcus'} ,
{ value: 'PHIL308', label: 'Language Revolution', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'R. Marcus'} ,
{ value: 'PHIL323', label: 'Philosophical Issues Sport', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'R. Simon'} ,
{ value: 'PHIL355W', label: 'Contemporary Philosophy', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'K. Doran'} ,
{ value: 'PHIL452', label: 'Sem Evolution & Morality', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'T. Lopez'} ,
{ value: 'PHIL482', label: 'Sem Objects & Properties', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'D. Edwards'} ,
{ value: 'PHIL550', label: 'Senior Seminar', duration:180,days:'w', startHour:1, startMinute: 00, prof:'A. Franklin'} ,
{ value: 'PHIL550', label: 'Senior Seminar', duration:180,days:'f', startHour:1, startMinute: 00, prof:'A. Franklin'} ,
{ value: 'PHIL550', label: 'Senior Seminar', duration:180,days:'w', startHour:1, startMinute: 00, prof:'R. Simon'} ,
{ value: 'PHYED103', label: 'Badminton-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'B. Hull'} ,
{ value: 'PHYED103', label: 'Badminton-Fall', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'S. Barnard'} ,
{ value: 'PHYED103', label: 'Badminton-Winter I', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'S. Stetson'} ,
{ value: 'PHYED103', label: 'Badminton-Winter I', duration:45,days:'mw', startHour:1, startMinute: 00, prof:'E. Summers'} ,
{ value: 'PHYED103', label: 'Badminton-Winter I', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'S. Barnard'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'T. Davis'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Fall', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'M. Krall'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'T. Davis'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Fall', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'M. Krall'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'T. Davis'} ,
{ value: 'PHYED104', label: 'Beginning Swimming-Winter I', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'M. Krall'} ,
{ value: 'PHYED106', label: 'Fitness-Fall', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'P. Cipicchio'} ,
{ value: 'PHYED106', label: 'Fitness - Fall', duration:45,days:'mw', startHour:9, startMinute: 00, prof:'E. McNamara'} ,
{ value: 'PHYED106', label: 'Fitness-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'S. Barnard'} ,
{ value: 'PHYED106', label: 'Dynamic Fitness-Fall', duration:60,days:'mw', startHour:8, startMinute: 00, prof:'T. Davis'} ,
{ value: 'PHYED106', label: 'Dynamic Fitness-Fall', duration:50,days:'tr', startHour:8, startMinute: 00, prof:'R. Haberbusch'} ,
{ value: 'PHYED106', label: 'Dynamic Fitness-Fall', duration:60,days:'mw', startHour:8, startMinute: 00, prof:'A. Stockwell'} ,
{ value: 'PHYED106', label: 'Dynamic Fitness-Fall', duration:60,days:'mw', startHour:8, startMinute: 00, prof:'M. Collins'} ,
{ value: 'PHYED106', label: 'Fitness-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'C. Gilligan'} ,
{ value: 'PHYED106', label: 'Fitness-Winter I', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'C. Gilligan'} ,
{ value: 'PHYED106', label: 'Dynamic Fitness-Winter', duration:60,days:'tr', startHour:8, startMinute: 00, prof:'S. Barnard'} ,
{ value: 'PHYED107', label: 'Free Weights-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'P. Cipicchio'} ,
{ value: 'PHYED107', label: 'Free Weights-Fall', duration:45,days:'tr', startHour:1, startMinute: 00, prof:'E. Summers'} ,
{ value: 'PHYED107', label: 'Free Weights-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'E. McNamara'} ,
{ value: 'PHYED107', label: 'Free Weights-Winter I', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'P. Cipicchio'} ,
{ value: 'PHYED108', label: 'Golf-Fall', duration:45,days:'mw', startHour:9, startMinute: 00, prof:'R. Haberbusch'} ,
{ value: 'PHYED108', label: 'Golf-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'S. Stetson'} ,
{ value: 'PHYED108', label: 'Golf-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'S. Stetson'} ,
{ value: 'PHYED113', label: 'Toning-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'E. Hull'} ,
{ value: 'PHYED113', label: 'Toning-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'E. Hull'} ,
{ value: 'PHYED113', label: 'Toning-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'E. Hull'} ,
{ value: 'PHYED113', label: 'Toning-Winter I', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'E. Hull'} ,
{ value: 'PHYED115', label: 'Racquetball-Fall', duration:45,days:'mw', startHour:9, startMinute: 00, prof:'D. Thompson'} ,
{ value: 'PHYED115', label: 'Racquetball-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'D. Thompson'} ,
{ value: 'PHYED115', label: 'Racquetball-Fall', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'G. McDonald'} ,
{ value: 'PHYED115', label: 'Racquetball-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'C. Gilligan'} ,
{ value: 'PHYED115', label: 'Racquetball-Fall', duration:45,days:'tr', startHour:1, startMinute: 00, prof:'M. Collins'} ,
{ value: 'PHYED115', label: 'Racquetball-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'A. Stockwell'} ,
{ value: 'PHYED115', label: 'Racquetball-Winter I', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'G. McDonald'} ,
{ value: 'PHYED115', label: 'Racquetball-Winter I', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'M. Collins'} ,
{ value: 'PHYED115', label: 'Racquetball-Winter I', duration:45,days:'tr', startHour:1, startMinute: 00, prof:'S. Stetson'} ,
{ value: 'PHYED116', label: 'Beg Rock Climbing-Fall', duration:150,days:'t', startHour:2, startMinute: 30, prof:'A. Jillings'} ,
{ value: 'PHYED116', label: 'Beg Rock Climbing-Fall', duration:150,days:'r', startHour:2, startMinute: 30, prof:'S. Jillings'} ,
{ value: 'PHYED116', label: 'Beg Rock Climbing-Winter I', duration:150,days:'t', startHour:2, startMinute: 30, prof:'A. Jillings'} ,
{ value: 'PHYED116', label: 'Beg Rock Climbing-Winter I', duration:150,days:'r', startHour:2, startMinute: 30, prof:'S. Jillings'} ,
{ value: 'PHYED118', label: 'Scuba-Fall (Addtnl Fee Redq)', duration:180,days:'m', startHour:6, startMinute: 45, prof:'K. Fagan'} ,
{ value: 'PHYED119', label: 'Skating-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'B. Hull'} ,
{ value: 'PHYED119', label: 'Skating-Winter I', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'B. Hull'} ,
{ value: 'PHYED119', label: 'Skating-Winter I', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'E. McNamara'} ,
{ value: 'PHYED119', label: 'Skating-Winter I', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'R. Haberbusch'} ,
{ value: 'PHYED120', label: 'Squash-Fall', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'J. King'} ,
{ value: 'PHYED120', label: 'Squash-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'P. Nizzi'} ,
{ value: 'PHYED120', label: 'Squash-Winter I', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'P. Nizzi'} ,
{ value: 'PHYED120', label: 'Squash-Winter I', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'J. King'} ,
{ value: 'PHYED120', label: 'Squash-Winter I', duration:45,days:'tr', startHour:1, startMinute: 00, prof:'P. Cipicchio'} ,
{ value: 'PHYED121', label: 'Tennis-Fall', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'K. Fagan'} ,
{ value: 'PHYED121', label: 'Tennis-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'J. King'} ,
{ value: 'PHYED122', label: 'Volleyball-Fall', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'B. Hull'} ,
{ value: 'PHYED123', label: 'Topic: Wellness', duration:50,days:'w', startHour:12, startMinute: 00, prof:'D. Thompson'} ,
{ value: 'PHYED127', label: 'Yoga-Fall', duration:45,days:'mw', startHour:9, startMinute: 00, prof:'P. Kloidt'} ,
{ value: 'PHYED127', label: 'Yoga-Fall', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'P. Kloidt'} ,
{ value: 'PHYED127', label: 'Yoga-Winter I', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'P. Kloidt'} ,
{ value: 'PHYED127', label: 'Yoga-Winter I', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'P. Kloidt'} ,
{ value: 'PHYED131', label: 'Lap Swim-Fall', duration:75,days:'tr', startHour:9, startMinute: 30, prof:'T. Davis'} ,
{ value: 'PHYED131', label: 'Lap Swim-Winter I', duration:45,days:'tr', startHour:8, startMinute: 00, prof:'D. Thompson'} ,
{ value: 'PHYED135', label: 'Basketball-Fall', duration:45,days:'tr', startHour:11, startMinute: 00, prof:'A. Stockwell'} ,
{ value: 'PHYED136', label: 'Indoor Rowing-Winter I', duration:45,days:'tr', startHour:1, startMinute: 00, prof:'E. Summers'} ,
{ value: 'PHYED138', label: 'Spinning-Winter I', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'G. McDonald'} ,
{ value: 'PHYED140', label: 'Bocce Ball-Fall', duration:45,days:'mw', startHour:10, startMinute: 00, prof:'P. Nizzi'} ,
{ value: 'PHYED140', label: 'Bocce Ball-Fall', duration:45,days:'mw', startHour:11, startMinute: 00, prof:'P. Nizzi'} ,
{ value: 'PHYS100', label: 'Survey Of Physics', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'D. Bunk'} ,
{ value: 'PHYS100L', label: 'Survey Physics Lab', duration:180,days:'m', startHour:1, startMinute: 00, prof:'D. Bunk'} ,
{ value: 'PHYS100L', label: 'Survey Physics Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'D. Bunk'} ,
{ value: 'PHYS100L', label: 'Survey Physics Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'TBA'} ,
{ value: 'PHYS160', label: 'Astronomy', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'P. Millet'} ,
{ value: 'PHYS200', label: 'Physics I', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'K. Jones-Smith'} ,
{ value: 'PHYS290', label: 'Quantum Physics', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'B. Collett'} ,
{ value: 'PHYS290L', label: 'Quantum Physics Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'A. Silversmith'} ,
{ value: 'PHYS290L', label: 'Quantum Physics Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'B. Collett'} ,
{ value: 'PHYS350', label: 'Classical Mechanics', duration:75,days:'mwf', startHour:1, startMinute: 00, prof:'K. Jones-Smith'} ,
{ value: 'PHYS370', label: 'Thermodynamics & Stat Phys', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'P. Millet'} ,
{ value: 'PHYS480', label: 'Etromagnetic Theory', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'S. Major'} ,
{ value: 'PHYS550', label: 'Senior Research Project', duration:210,days:'m', startHour:2, startMinute: 30, prof:'B. Collett'} ,
{ value: 'PPOL251', label: 'Intro Public Policy', duration:75,days:'mw', startHour:8, startMinute: 30, prof:'F. Anechiarico'} ,
{ value: 'PSYCH101', label: 'Intro To Psychology', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'T. McKee'} ,
{ value: 'PSYCH201', label: 'Stats & Research Methods', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'T. McKee'} ,
{ value: 'PSYCH204', label: 'Human Neuropsychology', duration:70,days:'mwf', startHour:2, startMinute: 30, prof:'R. Thiruchselvam'} ,
{ value: 'PSYCH205', label: 'Intro Brain And Behavior', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'D. Weldon'} ,
{ value: 'PSYCH314', label: 'Individual Differences', duration:180,days:'m', startHour:1, startMinute: 00, prof:'G. Pierce'} ,
{ value: 'PSYCH314L', label: 'Individual Differences Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'G. Pierce'} ,
{ value: 'PSYCH328', label: 'Cognitive Neuroscience', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'A. List'} ,
{ value: 'PSYCH328L', label: 'Cognitive Neurosci Lab', duration:180,days:'t', startHour:1, startMinute: 00, prof:'A. List'} ,
{ value: 'PSYCH328L', label: 'Cognitive Neurosci Lab', duration:180,days:'w', startHour:1, startMinute: 00, prof:'A. List'} ,
{ value: 'PSYCH356', label: 'Social Psychology', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Borton'} ,
{ value: 'PSYCH357', label: 'Human Memory', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'A. Grysman'} ,
{ value: 'PSYCH358', label: 'Educational Psychology', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'K. Sage'} ,
{ value: 'PSYCH364', label: 'Personality Psychology', duration:75,days:'wf', startHour:8, startMinute: 30, prof:'G. Pierce'} ,
{ value: 'PSYCH380', label: 'Research Design', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'J. Borton'} ,
{ value: 'PSYCH500', label: 'Senior Project', duration:50,days:'t', startHour:12, startMinute: 00, prof:'J. Vaughan'} ,
{ value: 'RELST115W', label: 'Parables', duration:75,days:'wf', startHour:2, startMinute: 30, prof:'S. Humphries-Brooks'} ,
{ value: 'RELST118', label: 'Relgn & Environmentalism', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'R. Seager'} ,
{ value: 'RELST202W', label: 'Ancient Jewish Wisdom', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'H. Ravven'} ,
{ value: 'RELST204W', label: 'Education Of Desire', duration:180,days:'t', startHour:1, startMinute: 00, prof:'H. Ravven'} ,
{ value: 'RELST207', label: 'Borderland Religion', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'R. Seager'} ,
{ value: 'RELST211W', label: 'Intro World Lit I', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'A. Mescall'} ,
{ value: 'RELST215', label: 'Religion In Film', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'S. Humphries-Brooks'} ,
{ value: 'RELST234', label: 'Sacred Journeys', duration:50,days:'mwf', startHour:12, startMinute: 00, prof:'J. Schermerhorn'} ,
{ value: 'RELST240', label: 'Classical Mythology', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'TBA'} ,
{ value: 'RELST256', label: 'Islam Modernity S Asia', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'A. Amar'} ,
{ value: 'RELST260', label: 'The Self Beyond Itself', duration:180,days:'r', startHour:1, startMinute: 00, prof:'H. Ravven'} ,
{ value: 'RELST289W', label: 'Intro Arabic Literature', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Mescall'} ,
{ value: 'RELST308', label: 'Sem: Yoga West & East', duration:180,days:'w', startHour:1, startMinute: 00, prof:'R. Seager'} ,
{ value: 'RELST396W', label: 'Sem: History Of Gods', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'T. Wilson'} ,
{ value: 'RELST408', label: 'Sem: Yoga West & East', duration:180,days:'w', startHour:1, startMinute: 00, prof:'R. Seager'} ,
{ value: 'RELST460', label: 'The Self Beyond Itself', duration:180,days:'r', startHour:1, startMinute: 00, prof:'H. Ravven'} ,
{ value: 'RSNST221', label: 'Early Russian Hist', duration:50,days:'mwf', startHour:11, startMinute: 00, prof:'S. Keller'} ,
{ value: 'RSNST225W', label: 'Madness, Murder, Mayhem', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'J. Bartle'} ,
{ value: 'RSNST345W', label: 'Ussr As Multinational', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'S. Keller'} ,
{ value: 'RUSSN110', label: 'First Term Russian', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'J. Bartle'} ,
{ value: 'RUSSN210', label: 'Third Term Russian', duration:50,days:'mwf', startHour:9, startMinute: 00, prof:'J. Bartle'} ,
{ value: 'RUSSN380', label: 'Readings 20Th C Russn Lit', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'F. Sciacca'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'D. Chambliss'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'D. Gilbert'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'D. Gilbert'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'TBA'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'TBA'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'TBA'} ,
{ value: 'SOC110', label: 'American Society', duration:75,days:'t', startHour:10, startMinute: 30, prof:'TBA'} ,
{ value: 'SOC223', label: 'Law And Society', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'Y. Zylan'} ,
{ value: 'SOC237', label: 'Political Sociology', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'Y. Zylan'} ,
{ value: 'SOC301W', label: 'Sociological Theory', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'D. Gilbert'} ,
{ value: 'SOC302', label: 'Research Methods', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'D. Chambliss'} ,
{ value: 'SOC329', label: 'Sem Soc Production Food', duration:180,days:'f', startHour:1, startMinute: 00, prof:'S. Ellingson'} ,
{ value: 'SOC354W', label: 'Sem Soc Class & Inequality', duration:180,days:'w', startHour:1, startMinute: 00, prof:'D. Gilbert'} ,
{ value: 'SOC356', label: 'Sem Sociological Analysis', duration:180,days:'m', startHour:1, startMinute: 00, prof:'D. Chambliss'} ,
{ value: 'SOC549W', label: 'Senior Seminar', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Ellingson'} ,
{ value: 'SOC549W', label: 'Senior Seminar', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'S. Ellingson'} ,
{ value: 'THETR108', label: 'Live Design & Prod Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Holland, D. Stoughton'} ,
{ value: 'THETR108', label: 'Live Design & Prod Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Holland, D. Stoughton'} ,
{ value: 'THETR108', label: 'Live Design & Prod Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Holland, D. Stoughton'} ,
{ value: 'THETR108', label: 'Live Design & Prod Ii', duration:50,days:'mwf', startHour:10, startMinute: 00, prof:'A. Holland, D. Stoughton'} ,
{ value: 'THETR201', label: 'Acting Styles:Theatrical', duration:75,days:'mwf', startHour:1, startMinute: 00, prof:'C. Bellini-Sharp'} ,
{ value: 'THETR204', label: 'Collaborative Playmaking', duration:75,days:'mw', startHour:2, startMinute: 30, prof:'J. Hesla'} ,
{ value: 'THETR244W', label: 'Tragedy: Then And Now', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'N. Rabinowitz'} ,
{ value: 'THETR303', label: 'Directing', duration:165,days:'tr', startHour:1, startMinute: 00, prof:'J. Hesla'} ,
{ value: 'THETR307', label: 'History Of Theatre', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'J. Hesla'} ,
{ value: 'THETR314', label: 'Meisner One:Transitions', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'M. Cryer'} ,
{ value: 'WMNST101W', label: 'Intro Women Studies', duration:75,days:'tr', startHour:9, startMinute: 00, prof:'J. Barry'} ,
{ value: 'WMNST101W', label: 'Intro Women Studies', duration:75,days:'wf', startHour:2, startMinute: 30, prof:'V. Adair'} ,
{ value: 'WMNST203', label: 'Women And War', duration:75,days:'mw', startHour:1, startMinute: 00, prof:'A. Lacsamana'} ,
{ value: 'WMNST222W', label: 'Race,Gender, & Culture', duration:75,days:'tr', startHour:10, startMinute: 30, prof:'A. Franklin'} ,
{ value: 'WMNST301W', label: 'Fem. Methodological Persp', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'J. Barry'} ,
{ value: 'WMNST310W', label: 'Black Womens Exper U.S.', duration:75,days:'tr', startHour:1, startMinute: 00, prof:'S. Haley'} ,
{ value: 'WMNST314', label: 'Sem Fem Perspect Class U.S.', duration:75,days:'wf', startHour:1, startMinute: 00, prof:'V. Adair'} ,
{ value: 'WMNST402', label: 'Sem Global Feminisms', duration:75,days:'tr', startHour:2, startMinute: 30, prof:'A. Lacsamana'} ,
];
