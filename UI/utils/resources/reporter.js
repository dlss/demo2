function showTrace(e) {
    window.event.srcElement.parentElement.getElementsByClassName('traceinfo')[0].className = 'traceinfo visible';
}
function closeTraceModal(e) {
    window.event.srcElement.parentElement.parentElement.className = 'traceinfo';
}
function openModal(imageSource) {
    var myWindow = window.open('', 'screenshotWindow');
    myWindow.document.write('<img src="' + imageSource + '" alt="screenshot" />');
}
