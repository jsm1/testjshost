angular.module('myStudyApp', ['ngSanitize', 'ngTagsInput', 'ng-sortable'])
	.controller('StudyController', function(wordsFilter, contenteditableWordCountFilter, $scope, $sce, $http, $timeout, $interval) {
		var myStudy = this;
		//constant
		myStudy.IMPORTANCE_WEIGHT = 100;
		myStudy.INTRODUCTION_WORD_LIMIT = 180;
		myStudy.CONCLUSION_WORD_LIMIT = 120;
		myStudy.WORD_WARNING_ZONE = 20;
		myStudy.OVERALL_WORD_LIMIT = 1200;
		myStudy.EXEC_SUMMARY_WORD_LIMIT = 180;

		myStudy.selectedKtars = [];

		myStudy.introductionCue = "";
		myStudy.introductionText = "";
		myStudy.conclusionCue = "";
		myStudy.conclusionText = "";
		myStudy.newTerm = "";
		myStudy.newAuthor = "";
		myStudy.newReading = "";

		myStudy.execSummaryText = "";

		myStudy.activeBlock = -1;

		myStudy.topics = [];

		//loading and writing mode
		myStudy.templateLoaded = false;
		myStudy.isReport = false;
		myStudy.reportTemplateLoaded = false;
		myStudy.typeLoaded = {"empty_essay": false, "empty_report": false, "continue_essay": false, "continue_report": false};
		myStudy.type = "empty_essay";

		myStudy.addTopic = function() {
			myStudy.topics.push({title: "", importance: "3", keyPoints: [{
				keyPointTitle: "", 
				importance: "1"
			}], topicText: "", wordLimit: 1});
			myStudy.calculateWordLimits();
		};

		myStudy.removeTopic = function(topicIndex) {
			var index = parseInt(topicIndex);
			if (index < 0 || index >= myStudy.topics.length) {
				return;
			}
			//delete 1 topic at index
			myStudy.topics.splice(index, 1);
			myStudy.calculateWordLimits();
		}

		myStudy.addKeyPoint = function(index) {
			var topicIndex = parseInt(index);
			if (topicIndex < 0 || topicIndex >= myStudy.topics.length) {
				return;
			}
			myStudy.topics[topicIndex].keyPoints.push({
				keyPointTitle: "", 
				importance: "3",
				wordLimit: 1
			});
			myStudy.calculateWordLimits();
		};

		myStudy.ktars = [
			{
				title: "Key Terminology",
				entryField: "",
				userKtars: [
				],
				lectureKtars: [
				],

			},
			{
				title: "Authors",
				entryField: "",
				userKtars: [
				],
				lectureKtars: [
				],

			},
			{
				title: "Readings",
				entryField: "",
				userKtars: [
				],
				lectureKtars: [
				],

			}

		];

		myStudy.addUserKtar = function(ktarIndex) {
			if (ktarIndex < 0 || ktarIndex > 2) {
				return;
			}
			myStudy.ktars[ktarIndex].userKtars.push({value: myStudy.ktars[ktarIndex].entryField, checked: true});
			myStudy.save();
		};

		myStudy.save = function() {
			var dataCopy = {};
			for (var k in myStudy) {
				if (myStudy.hasOwnProperty(k) && typeof myStudy[k] !== 'function') {
					dataCopy[k] = myStudy[k];
				}
			}

			var location;
			if (myStudy.isReport) {
				location = "reportData";
			} else {
				location = "studyData";
			}

			if (myStudy.type) {
				location = myStudy.type + "_data";
			} 
			window.localStorage.setItem(location, angular.toJson(dataCopy));
			//console.log(dataCopy);
		};

		myStudy.load = function(arg) {
			var dataString;
			if (myStudy.type) {
				dataString = window.localStorage.getItem(myStudy.type + "_data");
			} 
			/*
			if () {
				dataString = window.localStorage.getItem('reportData');
			} else {
				dataString = window.localStorage.getItem('studyData');
			}*/
			if (!dataString) {
				return;
			}
			var dataObject = {};
			if (arg) {
				dataObject = arg;
			} else {
				var dataObject = JSON.parse(dataString);
			}
			
			for (k in myStudy) {
				if (myStudy.hasOwnProperty(k) && dataObject.hasOwnProperty(k)) {
					myStudy[k] = dataObject[k];
				}
			}
			
			
			/*myStudy.introductionCue = dataObject.introductionCue;
			myStudy.conclusionCue = dataObject.conclusionCue;
			myStudy.topics = dataObject.topics;
			myStudy.ktars = dataObject.ktars;
			myStudy.introductionText = dataObject.introductionText;
			myStudy.conclusionText = dataObject.conclusionText;*/


		};

		myStudy.load();
		$interval(myStudy.save, 500);

		



		myStudy.getWordCountClass = function(text, limit) {
			var wordsUsed = wordsFilter(text);
			if ((limit - wordsUsed) < myStudy.WORD_WARNING_ZONE && (limit - wordsUsed) >= 0) {
				return "warning";
			} else if ((limit - wordsUsed) < 0) {
				return "over";
			} 
		}

		myStudy.shouldShowBody = function() {
			if (myStudy.topics.length == 0) {
				return true;
			}
			return false;
		}

		myStudy.swapTopics = function(from, to) {
			if (from < 0 || from >= myStudy.topics.length || to < 0 || to >= myStudy.topics.length) {
				return;
			}

			$timeout(function() {
				var topics = angular.copy(myStudy.topics);
				var temp = topics[from];
				topics[from] = topics[to];
				topics[to] = temp;
				angular.copy(topics, myStudy.topics);
			});
			
			//console.log("FROM:\n" + JSON.stringify(myStudy.topics[from]));
			//console.log("TO:\n" + JSON.stringify(myStudy.topics[to]));
		}

		myStudy.makeWritingAreaFocused = function(clickEvent) {
			setTimeout(function() {
				var target = $(clickEvent.target);
				target.closest("[contenteditable='true']").html("HIIIII");
			}, 100, clickEvent);
		}

		myStudy.removeKeyPoint = function(parentIndex, index) {
			var topicIndex = parseInt(parentIndex);
			var kpIndex = parseInt(index);
			if (topicIndex < 0 || topicIndex >= myStudy.topics.length || kpIndex < 0 || kpIndex >= myStudy.topics[topicIndex].keyPoints.length) {
				return;
			}
			//delete 1 topic at index
			myStudy.topics[topicIndex].keyPoints.splice(index, 1);
			myStudy.calculateWordLimits();
		}

		myStudy.swapKeyPoints = function(parent, from, to) {
			if (!Number.isInteger(parent) || !Number.isInteger(from) || !Number.isInteger(to)) {
				return;
			}
			if (parent < 0 || parent >= myStudy.topics.length || from < 0 || from >= myStudy.topics[parent].keyPoints.length || to < 0 || to >= myStudy.topics[parent].keyPoints.length) {
				return;
			}
			$timeout(function() {
				var keyPoints = angular.copy(myStudy.topics[parent].keyPoints);
				var temp = keyPoints[from];
				keyPoints[from] = keyPoints[to];
				keyPoints[to] = temp;
				angular.copy(keyPoints, myStudy.topics[parent].keyPoints);
			});
		}

		myStudy.calculateWordLimits = function() {
			var bodyWordLimit = myStudy.OVERALL_WORD_LIMIT - myStudy.INTRODUCTION_WORD_LIMIT - myStudy.CONCLUSION_WORD_LIMIT;
			if (bodyWordLimit >= 100) {
				var bodyWordsTens = bodyWordLimit / 10;
				var goalSum = bodyWordsTens;
				var sumOfTopicImportances = 0;
				myStudy.topics.forEach(function(topic, index) {
					sumOfTopicImportances += parseInt(topic.importance);
					//add index variable
					topic.orderIndex = index;
				});
				var topicImportanceSum = sumOfTopicImportances;



				var tempTopics = angular.copy(myStudy.topics);
				tempTopics.sort(function(a, b) {
					return a.importance - b.importance;
				});
				tempTopics.forEach(function(topic, index) {
					var roundedTopicLimit = Math.round((parseInt(topic.importance) / topicImportanceSum) * goalSum);
					myStudy.topics[topic.orderIndex].wordLimit = (roundedTopicLimit * 10);
					goalSum -= roundedTopicLimit;
					topicImportanceSum -= parseInt(topic.importance);
					console.log("TOPIC: " + topic.title + " limit: " + topic.wordLimit);
				});

				//key point word limits
				myStudy.topics.forEach(function(topic, index) {
					var goalTensWordLimit = topic.wordLimit / 10;
					var sumOfKeyPointImportances = 0;
					topic.keyPoints.forEach(function(keyPoint, kpIndex) {
						sumOfKeyPointImportances += parseInt(keyPoint.importance);
						keyPoint.orderIndex = kpIndex;
					});

					var tempKeyPoints = angular.copy(topic.keyPoints);
					tempKeyPoints.sort(function(a, b) {
						return a.importance - b.importance;
					});

					tempKeyPoints.forEach(function(keyPoint, tempKpIndex) {
						var roundedLimit = Math.round((parseInt(keyPoint.importance) / sumOfKeyPointImportances) * goalTensWordLimit);
						myStudy.topics[index].keyPoints[keyPoint.orderIndex].wordLimit = roundedLimit * 10;
						goalTensWordLimit -= roundedLimit;
						sumOfKeyPointImportances -= parseInt(keyPoint.importance);
					});
				});

				//padding
				/*var topicIncrementingIndex = 0;
				while (myStudy.topicWordLimitSum() < bodyWordLimit) {
					console.log("IN HERE");
					myStudy.topics[topicIncrementingIndex].wordsLimit++;
					topicIncrementingIndex++;
					topicIncrementingIndex = topicIncrementingIndex % myStudy.topics.length;
				}*/

			}
		}

		myStudy.topicWordLimitSum = function() {
			var sum = 0;
			myStudy.topics.forEach(function(topic) {
				sum += parseInt(topic.wordLimit);
			});
			return sum;
		}

		myStudy.matchesForKtar = function(text) {
			var numMatches = 0;
			if (!text) {
				return 0;
			}

			//create a 'safe' regex for the text
			var specialCharacterStripper = /[\[\(\)\]\\\/]/g
			var strippedText = text.replace(specialCharacterStripper, "");
			var matchRegex = new RegExp("\\b(" + strippedText + ")\\b", "ig");

			//intro and conclusion

			var intro_matches = myStudy.introductionText.match(matchRegex);
			if (intro_matches) {
				numMatches += intro_matches.length;
			}

			var conclusion_matches = myStudy.conclusionText.match(matchRegex);
			if (conclusion_matches) {
				numMatches += conclusion_matches.length;
			}

			//exec summary if report
			if (myStudy.isReport) {
				var exec_summary_matches = myStudy.execSummaryText.match(matchRegex);
				if (exec_summary_matches) {
					numMatches += exec_summary_matches.length;
				}
			}
			
			myStudy.topics.forEach(function(topic, index) {
				//strip tags
				//will cause problems if a person uses < and then a > in their writing
				var matches = topic.topicText.match(matchRegex);
				if (matches) {
					numMatches += (matches.length);

				}

				//topic.topicTextHighlighted = topic.topicText.replace(matchRegex, "<span class='ktar-review-highlighted-text'>$1</span>");
			});

			return numMatches;
		}

		myStudy.addKtarSelection = function(text) {
			if (!text) {
				return;
			}
			//create a 'safe' regex for the text
			var specialCharacterStripper = /[\[\(\)\]\\\/]/g
			var strippedText = text.replace(specialCharacterStripper, "");

			//already in so no need to add
			if (myStudy.selectedKtars.indexOf(strippedText) >= 0) {
				return;
			} else {
				myStudy.selectedKtars = [strippedText];
			}

		}

		myStudy.removeKtarSelection = function(text) {
			if (!text) {
				return;
			}

			//create a 'safe' regex for the text
			var specialCharacterStripper = /[\[\(\)\]\\\/]/g
			var strippedText = text.replace(specialCharacterStripper, "");

			var index = myStudy.selectedKtars.indexOf(strippedText);
			//not in 
			if (index === -1) {
				return;
			}

			myStudy.selectedKtars = [];
		}

		myStudy.getHighlightedText = function() {
			/*if (!text) {
				return 0;
			}*/

			//create a 'safe' regex for the text


			myStudy.selectedKtars.forEach(function(ktarText) {
				
				var matchRegex = new RegExp("\\b(" + ktarText + ")\\b", "ig");
				console.log(ktarText);
				myStudy.topics.forEach(function(topic, index) {
					topic.topicTextHighlighted = topic.topicText.replace(matchRegex, "<span class='ktar-review-highlighted-text'>$1</span>");
				});
			});

		}

		myStudy.getTotalWords = function() {
			var totalWords = 0;
			totalWords += contenteditableWordCountFilter(myStudy.introductionText);
			
			if (myStudy.isReport) {
				totalWords += contenteditableWordCountFilter(myStudy.execSummaryText);
			}

			totalWords += contenteditableWordCountFilter(myStudy.conclusionText);
			myStudy.topics.forEach(function(topic) {
				totalWords += contenteditableWordCountFilter(topic.topicText);
			});
			return totalWords;
		}

		myStudy.getSnippetsForText = function(text) {
			//make text 'safe' for regex

			if (!text) {
				return;
			}
			var specialCharacterStripper = /[\[\(\)\]\\\/]/g
			var strippedText = text.replace(specialCharacterStripper, "");
			
			var snippets = [];

			//regexes 
			var matchRegex = new RegExp("(\\w+\\s){0,2}\\b(" + strippedText + ")\\b(\\s\\w+){0,2}", "ig");
			var highlightRegex = new RegExp("\\b(" + strippedText + ")\\b", "ig");
			if (myStudy.isReport) {
				//exec summary
				var execSummaryMatches = myStudy.execSummaryText.match(matchRegex);
				if (execSummaryMatches) {
					execSummaryMatches.forEach(function(match) {
						var formatted = "..." + match.replace(highlightRegex, "<span class='ktar-review-highlighted-text'>$1</span>") + "...";
						snippets.push(formatted);
					});
				}				
			}


			//intro
			var introMatches = myStudy.introductionText.match(matchRegex);
			if (introMatches) {
				introMatches.forEach(function(match) {
					var formatted = "..." + match.replace(highlightRegex, "<span class='ktar-review-highlighted-text'>$1</span>") + "...";
					snippets.push(formatted);
				});
			}

			//topics
			myStudy.topics.forEach(function(topic) {
				var matches = topic.topicText.match(matchRegex);
				if (matches) {
					matches.forEach(function(match) {
						var formatted = "..." + match.replace(highlightRegex, "<span class='ktar-review-highlighted-text'>$1</span>") + "...";
						snippets.push(formatted);
					});
				}
				

			});

			//conclusion
			var conclusionMatches = myStudy.conclusionText.match(matchRegex);
			if (conclusionMatches) {
				conclusionMatches.forEach(function(match) {
					var formatted = "..." + match.replace(highlightRegex, "<span class='ktar-review-highlighted-text'>$1</span>") + "...";
					snippets.push(formatted);
				});
			}
			return snippets;
		}


		myStudy.getActiveBlock = function() {
			return myStudy.activeBlock;
		}

		myStudy.setActiveBlock = function(block) {
			myStudy.activeBlock = block;
		}

		//next and previous buttons
		myStudy.nextPlanTab = function() {
			var $tab = $("a.cue-tab-link.w--current");
			if ($tab.is(":last-child")) {
				myStudy.skipPlan();
				return;
			}
			$tab.next("a.cue-tab-link").click();
			$('html, body').scrollTop(0);
		}
		myStudy.skipPlan = function() {
			$("a[data-w-tab='Write']").click();
			$('html, body').scrollTop(0);
		}

		myStudy.previousPlanTab = function() {
			$("a.cue-tab-link.w--current").prev("a.cue-tab-link").click();
			$('html, body').scrollTop(0);
		}

		myStudy.runKtarDisplayList = function(event) {


			var $el = $(event.target);
			if (!$el.is('a')) {
				$el = $el.parents("a").first();
			}

			//make sure all pills are shown first
			$("a.review-losenge").css("display", "inline-block");

			$el.css("display", "none");

			//hide all
			$("a.ktar-review-title-block, ul.ktar-review-highlight-list").css("display", "none");

			$el.next("a.ktar-review-title-block").css("display", "inline-block").next("ul.ktar-review-highlight-list").css("display", "block");
		}

		myStudy.runKtarHideList = function(event) {

			var $el = $(event.target);
			if (!$el.is('a')) {
				$el = $el.parents('a').first();
			}
			$el.css("display", "none");
			$el.next("ul.ktar-review-highlight-list").css("display", "none");
			$el.prev("a.review-losenge").css("display", "inline-block");	
		}


		myStudy.getBarPercentage = function() {
			var totalWordsUsed = myStudy.getTotalWords();
			var percentage = Math.min(Math.round((totalWordsUsed / myStudy.OVERALL_WORD_LIMIT) * 100), 100);
			var returnValue = {};
			returnValue.width = percentage + "%";
			return returnValue;
		}
		myStudy.refreshWebflow = function() {
		}
		//init functions
		myStudy.calculateWordLimits();



		myStudy.loadTemplateData = function(template, cleanLoad) {
			var url = "";
			if (template === 'empty_report') {
				url = "https://rawgit.com/jsm1/testjshost/master/empty_report.json";
				myStudy.isReport = true;
				myStudy.type = template;
			} else if (template === 'empty_essay') {
				url = "https://rawgit.com/jsm1/testjshost/master/empty_essay.json";
				myStudy.type = template;
			} else if (template === 'continue_report') {
				url = "https://rawgit.com/jsm1/testjshost/master/continue_report.json";
				myStudy.type = template;
				myStudy.isReport = true;
			} else if (template === 'continue_essay') {
				url = "https://rawgit.com/jsm1/testjshost/master/continue_essay.json";	
				myStudy.type = template;	
			} else {
				return;
			}

			//load existing if it exists
			myStudy.load();

			if (myStudy.typeLoaded[template] && !cleanLoad) {
				return;
			}
			/*if (myStudy.typeLoaded[template] && !myStudy.isReport) {
				return;		
			} else if (myStudy.reportTemplateLoaded && myStudy.isReport) {
				return;
			}*/

			$http.get((url))
			.then(function(response) {

				myStudy.load(response.data);
				myStudy.calculateWordLimits();
				/*if (myStudy.isReport) {
					myStudy.reportTemplateLoaded = true;
				} else {
					myStudy.templateLoaded = true;
				}*/
				myStudy.typeLoaded[template] = true;
			}, function() {
				console.log("error");
			});
		}

		myStudy.restoreDefaultContent = function() {
			if (!myStudy.type) {
				myStudy.type = "empty_essay";
			}
			myStudy.typeLoaded[myStudy.type] = false;
			myStudy.loadTemplateData(myStudy.type, true);
		}

		//tab presses
		myStudy.handleTab = function(event) {
			//if not a shift tab, ignore it
			//9 is tab keycode
			var code = event.keyCode || event.charCode;
			if (code !== 9 || event.shiftKey !== true) {
				return;
			}
			event.preventDefault();
			//insert tab
			var sel, range, html;
			if (window.getSelection) {
				sel = window.getSelection();
				range = sel.getRangeAt(0);

				var newNode = document.createElement("span");
				newNode.className = "tab-space";
				newNode.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
				range.insertNode(newNode);
				range.collapse(false);
			} 

		}

		myStudy.keyDownTab = function(event) {
			var code = event.keyCode || event.charCode;
			if ((code === 9) && event.shiftKey === true) {
				event.preventDefault();
			}
			return;
		}
/*
		//pagination
		myStudy.getPages = function() {
			//get all text together
			var allText = "";
			var topicSeparator = "<br><br>";
			allText += myStudy.introductionText;
			
			if (myStudy.isReport) {
				allText += topicSeparator
				allText += myStudy.execSummaryText;
			}

			myStudy.topics.forEach(function(topic) {
				allText += topicSeparator
				allText += topic.topicText;
			});

			allText += topicSeparator
			allText += myStudy.conclusionText;

			var pagesByWords = breakIntoWordBlocks(allText, 450);

			var splitText = allText.split("");
			//compile pages
			var i = 0;
			while ($("#staging-content").height <= 0) {
				i++;
			}
			var stagingBlock = document.getElementById("staging-component-block");
			var stagingContent = document.getElementById("staging-content");
			$("#staging-component-block").css("visibility", "hidden");
			var height = $("#staging-component-block").height();
			console.log("HEIGHT IS " + height);
			//page size is line height * 39 from cael's definition of a page
			var lineHeight = 26
			var pageHeight = 26 * 39;
			var pages = [];
			var pagesCount = 0;

			for (var i = 0; i < splitText.length; i++) {
				stagingContent.innerHTML += splitText[i];
				console.log($("#staging-content").height());
				//exceeded page height, create a new page
				if ($("#staging-content").height() > pageHeight) {
					pages[pagesCount] = stagingContent.innerHTML.substring(0, stagingContent.innerHTML.length - splitText[i].length);
					pagesCount++;
					stagingContent.innerHTML = splitText[i];
				}
			}
			pages[pagesCount] = stagingContent.innerHTML;
			//stagingContent.innerHTML = "";
			console.log(pages);
			return pages;
		}*/

		myStudy.breakIntoWordBlocks = function(text, blockSize) {

		}

	}).filter('highlight', function() {
		return function(inputText, selectedKtars) {
			var highlightedText = inputText;
			selectedKtars.forEach(function(ktarText) {
				
				var matchRegex = new RegExp("\\b(" + ktarText + ")\\b", "ig");
				console.log(ktarText);
				highlightedText = highlightedText.replace(matchRegex, "<span class='ktar-review-highlighted-text'>$1</span>");
			});

			return highlightedText;

		}
	}).filter('words', function() {
		return function(input) {
			if (!input) {
				return 0;
			}

			var splitRegex = /\s+/g;
			var split = input.split(splitRegex);
			var numWords = split.length;
			return numWords;
		}
	}).filter('contenteditableWordCount', function() {
		return function(input) {
			if (!input) {
				return 0;
			}
			var replaced = input.replace(/<\/?div>|<\/?br\/?>/g, " ");
			var splitRegex = /[\s\u00a0]+/g;
			var split = replaced.split(splitRegex);
			var numWords = split.length;
			if (!split[split.length - 1]) {
				numWords -= 1;
			}
			return numWords;
		}
	}).directive("contenteditable", function() {
  return {
    restrict: "A",
    require: "ngModel",
    link: function(scope, element, attrs, ngModel) {

      function read() {

        var html = element.html();
        if (html === '<br>' || html == '<div></div>') {
            html = "";
        }

        if (element.hasClass('add-btn')) {
        	//html += "\u00a0\u00a0";
      		//ngModel.$setViewValue(html);
      		//html tag regex
      		var regex = /<[^>]+>/g;
      		html = html.replace(regex, "");
      	}
        html = html.replace(/&nbsp;/g, "\u00a0");
        html = html.replace(/&lt;/g, "<");
        html = html.replace(/&gt;/g, ">");
        html = html.replace(/&amp;/g, "&");
        ngModel.$setViewValue(html);
      }

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || "");
      };

      element.bind("blur keyup change", function() {
        scope.$apply(read);
      });
    }
  };
});