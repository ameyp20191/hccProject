function clearLog() {
  var background = chrome.extension.getBackgroundPage();
  background.initLog();
}

function toggleLogging() {
  var background = chrome.extension.getBackgroundPage();
  showLog(true);
  background.toggleLogging();
  updateStudyButton();
 }

function showLog(pretty) {
  var background = chrome.extension.getBackgroundPage();
  var log = background.log;
  // Pretty print JSON
  if (pretty) {
    $('#log-content').text(JSON.stringify(log, null, 4));
  }
  else {
    $('#log-content').text(JSON.stringify(log));
  }
}

function updateStudyButton() {
  var background = chrome.extension.getBackgroundPage();
  var buttonText;

  // Click to toggle logging
  if (background.doLog) {
    buttonText = "Stop user study";
  }
  else {
    buttonText = "Start user study";
  }

  $('#toggle-study').val(buttonText);
}

$(document).ready(function() {
  updateStudyButton();
  $('#toggle-study').click(toggleLogging);
  $('#show-nice-log').click(function() { showLog(true); });
  $('#show-compact-log').click(function() { showLog(false); });
  $('#clear-log').click(function() { clearLog(); showLog(true); });
});
