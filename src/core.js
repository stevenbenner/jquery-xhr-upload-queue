/**
 * XHR Upload Queue Core
 *
 * @fileoverview  Core variables and plugin object.
 * @link          https://github.com/stevenbenner/jquery-xhr-upload-queue
 * @author        Steven Benner (http://stevenbenner.com/)
 * @requires      jQuery 1.7+
 */

// detect features
var isFilesAPIAvailable = window.FileReader !== undefined,
	isXHR2Available = new window.XMLHttpRequest().upload !== undefined;

/**
 * Builds and hooks the plugin system.
 * @param {Object} opts The options object to use for the plugin.
 * @return {Object} jQuery object for the matched selectors.
 */
$.fn.xhrUploadQueue = function(opts) {

	// don't do any work if there were no matched elements
	if (!this.length) {
		return this;
	}

	// extend options
	var options = $.extend({}, $.fn.xhrUploadQueue.defaults, opts);

	// test for FilesAPI and XHR2 support
	// and setup feature support classes
	if (!isFilesAPIAvailable || !isXHR2Available) {
		this.removeClass(options.fullSupportClass);
		this.addClass(options.noSupportClass);
		if (!isFilesAPIAvailable) {
			this.addClass(options.noFilesAPIClass);
		}
		if (!isXHR2Available) {
			this.addClass(options.noXHR2Class);
		}
		// we cant do anything without these features
		options.noSupport.call();
		return this;
	}
	this.addClass(options.fullSupportClass);

	// apply to every matched element
	return this.each(function() {

		var $this = $(this),
			fileQueue = new FileQueue(options);

		// add data reference to the FileQueue
		$this.data('fileQueue', fileQueue);

		// execute the init callback
		options.init.call(fileQueue);

		// hook drag and drop event handlers
		if (options.hookDragAndDrop === true) {
			$this.on({
				dragenter: function(event) {
					stopEvent(event);
					$this.addClass(options.hoverClass);
					return false;
				},
				dragover: function(event) {
					stopEvent(event);
					$this.addClass(options.hoverClass);
					return false;
				},
				dragleave: function(event) {
					stopEvent(event);
					$this.removeClass(options.hoverClass);
					return false;
				},
				drop: function(event) {
					stopEvent(event);
					$this.removeClass(options.hoverClass);
					fileQueue.addFiles(event.originalEvent.dataTransfer.files);
				}
			});
		}

		// hook change event to any file inputs
		// and set the accept attribute
		if ($this.is('input[type=file]')) {
			$this.on('change', function() {
				fileQueue.addFiles(this.files);
			});
			if (options.acceptedMimeTypes.length > 0) {
				$this.attr('accept', options.acceptedMimeTypes.join(','));
			}
		} else {
			var fileInputs = $this.find('input[type=file]');
			fileInputs.on('change', function() {
				fileQueue.addFiles(this.files);
			});
			if (options.acceptedMimeTypes.length > 0) {
				fileInputs.attr('accept', options.acceptedMimeTypes.join(','));
			}
		}

		// hook form submit
		if ($this.is('form')) {
			$this.on('submit', function() {
				fileQueue.beginUpload();
				return false;
			});
		}

	});

};

/**
 * Default options for the plugin.
 * @type Object
 */
$.fn.xhrUploadQueue.defaults = {

	// system settings
	maximumQueueSize: 10,
	maximumFileSize: 1048576,
	uploadConcurrency: 2,
	acceptedMimeTypes: [],
	postUrl: 'upload.php',
	filesInputName: 'filesinput',
	hookDragAndDrop: true,
	customFormData: null,
	silenceZeroByteErrors: true,

	// class names
	hoverClass: 'draghover',
	fullSupportClass: 'fullsupport',
	noSupportClass: 'nosupport',
	noFilesAPIClass: 'nofilesapi',
	noXHR2Class: 'noxhr2',

	// callbacks
	init: $.noop,
	queueAdd: $.noop,
	queueChange: $.noop,
	queueRemove: $.noop,
	handleUnacceptedFiles: $.noop,
	uploadStart: $.noop,
	uploadFinish: $.noop,
	noSupport: $.noop,
	processFileList: function(files) {
		return files;
	}

};

/**
 * Enumeration of file errors.
 * @enum {String}
 */
$.fn.xhrUploadQueue.FileError = {
	QUEUE_FULL: 'The upload queue is full',
	FILE_TOO_LARGE: 'The file is too large',
	UNACCEPTED_MIME_TYPE: 'That type of file is not accepted',
	ZERO_BYTE_FILE: 'File is empty, or is a folder'
};
