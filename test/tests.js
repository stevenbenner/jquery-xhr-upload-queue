$(function() {
	'use strict';

	test('test environment', function() {
		ok(window.FileReader !== undefined, 'window.FileReader is defined');
		ok(new window.XMLHttpRequest().upload !== undefined, 'window.XMLHttpRequest has upload property');
	});

	test('xhrUploadQueue defined', function() {
		var form = $('<form></form>');
		ok(form.xhrUploadQueue, 'xhrUploadQueue method is defined');
		deepEqual(typeof form.xhrUploadQueue, 'function', 'xhrUploadQueue is a function');
	});

	test('expose default settings', function() {
		ok($.fn.xhrUploadQueue.defaults, 'defaults is defined');
		// existance check for each property
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('maximumQueueSize'), 'maximumQueueSize exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('maximumFileSize'), 'maximumFileSize exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('uploadConcurrency'), 'uploadConcurrency exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('acceptedMimeTypes'), 'acceptedMimeTypes exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('postUrl'), 'postUrl exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('filesInputName'), 'filesInputName exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('hookDragAndDrop'), 'hookDragAndDrop exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('customFormData'), 'customFormData exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('silenceZeroByteErrors'), 'silenceZeroByteErrors exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('hoverClass'), 'hoverClass exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('fullSupportClass'), 'fullSupportClass exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('noSupportClass'), 'noSupportClass exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('noFilesAPIClass'), 'noFilesAPIClass exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('noXHR2Class'), 'noXHR2Class exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('init'), 'init exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('queueAdd'), 'queueAdd exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('queueChange'), 'queueChange exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('queueRemove'), 'queueRemove exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('handleUnacceptedFiles'), 'handleUnacceptedFiles exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('uploadStart'), 'uploadStart exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('uploadFinish'), 'uploadFinish exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('noSupport'), 'noSupport exists');
		ok($.fn.xhrUploadQueue.defaults.hasOwnProperty('processFileList'), 'processFileList exists');
	});

	test('expose FileError enum', function() {
		ok($.fn.xhrUploadQueue.FileError, 'FileError is defined');
		// existance check for each property
		ok($.fn.xhrUploadQueue.FileError.hasOwnProperty('QUEUE_FULL'), 'QUEUE_FULL exists');
		ok($.fn.xhrUploadQueue.FileError.hasOwnProperty('FILE_TOO_LARGE'), 'FILE_TOO_LARGE exists');
		ok($.fn.xhrUploadQueue.FileError.hasOwnProperty('UNACCEPTED_MIME_TYPE'), 'UNACCEPTED_MIME_TYPE exists');
		ok($.fn.xhrUploadQueue.FileError.hasOwnProperty('ZERO_BYTE_FILE'), 'ZERO_BYTE_FILE exists');
	});

	test('return original jQuery object', function() {
		var form = $('<form></form>'),
			empty = $('#thisDoesntExist');
		deepEqual(form.xhrUploadQueue(), form, 'original jQuery object returned for matched selector');
		deepEqual(empty.xhrUploadQueue(), empty, 'original jQuery object returned for empty selector');
	});

	test('add support class', function() {
		var form = $('<form></form>').xhrUploadQueue();
		ok(form.hasClass($.fn.xhrUploadQueue.defaults.fullSupportClass), 'fullSupportClass added');
	});

	test('queue callbacks fire', function() {
		expect(13);

		var lastFile = null,
			form = $('<form></form>').xhrUploadQueue({
				acceptedMimeTypes: [ 'text/plain' ],
				init: function() {
					ok(this instanceof Object, 'init callback fired with context');
				},
				queueAdd: function(file) {
					ok(this instanceof Object, 'queueAdd callback fired with context');
					equal(file.name, 'test.txt', 'file name is correct');
					lastFile = file;
				},
				queueChange: function() {
					ok(this instanceof Object, 'queueChange callback fired with context');
				},
				queueRemove: function() {
					ok(this instanceof Object, 'queueRemove callback fired with context');
				},
				handleUnacceptedFiles: function() {
					ok(this instanceof Object, 'handleUnacceptedFiles callback fired with context');
				},
				uploadStart: function() {
				},
				uploadFinish: function() {
				},
				noSupport: function() {
				},
				processFileList: function(files) {
					ok(this instanceof Object, 'processFileList callback fired with context');
					return files;
				}
			});

		form.trigger($.Event('drop', { originalEvent: { dataTransfer: { files: [ new MockFile(100, 'test.txt', 'text/plain') ] } } }));
		form.trigger($.Event('drop', { originalEvent: { dataTransfer: { files: [ new MockFile(100, 'test.txt', 'text/plain') ] } } }));
		lastFile.removeFromQueue();
		form.trigger($.Event('drop', { originalEvent: { dataTransfer: { files: [ new MockFile(100, 'test.css', 'text/css') ] } } }));
	});

	test('hook drag and drop events', function() {
		var form = $('<form></form>').xhrUploadQueue();

		ok(!form.hasClass($.fn.xhrUploadQueue.defaults.hoverClass), 'form does not have hover class');

		form.trigger('dragenter');
		ok(form.hasClass($.fn.xhrUploadQueue.defaults.hoverClass), 'dragenter added hover class');

		form.trigger('dragleave');
		ok(!form.hasClass($.fn.xhrUploadQueue.defaults.hoverClass), 'dragleave removed hover class');

		form.trigger('dragover');
		ok(form.hasClass($.fn.xhrUploadQueue.defaults.hoverClass), 'dragover added hover class');

		form.trigger($.Event('drop', { originalEvent: { dataTransfer: { files: [] } } }));
		ok(!form.hasClass($.fn.xhrUploadQueue.defaults.hoverClass), 'drop removed hover class');
	});

	test('hook form submit event', function() {
		var uploadStart = false,
			form = $('<form></form>').xhrUploadQueue({
				uploadStart: function() {
					uploadStart = true;
				}
			});

		form.trigger('submit');
		ok(uploadStart, 'form submitted');
	});

	function MockFile(size, name, type) {
		this.size = size;
		this.name = name;
		this.type = type;
	}

});
