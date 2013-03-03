/**
 * XHR Upload Queue Grunt Config
 */

module.exports = function(grunt) {
	'use strict';

	// configure grunt
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		buildpath: 'dist/<%= pkg.version %>',
		files: {
			cat: 'jquery.xhruploadqueue-<%= pkg.version %>.js',
			min: 'jquery.xhruploadqueue-<%= pkg.version %>.min.js',
			zip: 'jquery.xhruploadqueue-<%= pkg.version %>.zip'
		},
		banner: [
			'/*!',
			' <%= pkg.title %> - v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>',
			' <%= pkg.homepage %>',
			' Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %> (<%= pkg.author.url %>).',
			' Released under <%= _.pluck(pkg.licenses, "type").join(", ") %> license.',
			' <%= _.pluck(pkg.licenses, "url").join("\\n ") %>',
			'*/\n'
		].join('\n'),
		clean: {
			dist: [ '<%= buildpath %>' ]
		},
		jshint: {
			grunt: {
				src: [ 'Gruntfile.js' ],
				options: {
					jshintrc: '.jshintrc'
				}
			},
			tests: {
				src: [ 'test/**/*.js' ],
				options: {
					jshintrc: 'test/.jshintrc'
				}
			},
			dist: {
				src: [ '<%= buildpath %>/<%= files.cat %>' ],
				options: {
					jshintrc: 'src/.jshintrc'
				}
			}
		},
		concat: {
			dist: {
				src: [
					'src/intro.js',
					'src/core.js',
					'src/filequeue.js',
					'src/fileupload.js',
					'src/utility.js',
					'src/outro.js'
				],
				dest: '<%= buildpath %>/<%= files.cat %>',
				options: {
					banner: '<%= banner %>',
					stripBanners: true
				}
			}
		},
		qunit: {
			files: [ 'test/index.html' ]
		},
		uglify: {
			dist: {
				files: {
					'<%= buildpath %>/<%= files.min %>': '<%= buildpath %>/<%= files.cat %>'
				},
				options: {
					banner: '<%= banner %>'
				}
			}
		},
		copy: {
			license: {
				src: [ 'LICENSE.txt' ],
				dest: '<%= buildpath %>/LICENSE.txt'
			}
		},
		compress: {
			zip: {
				options: {
					archive: '<%= buildpath %>/<%= files.zip %>'
				},
				files: [
					{
						expand: true,
						cwd: '<%= buildpath %>/',
						src: [ '**/*' ]
					}
				]
			}
		},
		watch: {
			grunt: {
				files: [ 'Gruntfile.js' ],
				tasks: [ 'jshint:grunt' ]
			},
			src: {
				files: [ 'src/**/*.js' ],
				tasks: [ 'concat', 'jshint:dist', 'qunit' ]
			},
			tests: {
				files: [ 'test/**/*.js' ],
				tasks: [ 'jshint:tests', 'qunit' ]
			}
		}
	});

	// load grunt plugins
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');

	// register grunt tasks
	grunt.registerTask('default', [ 'build:js' ]);
	grunt.registerTask('build', [ 'build:js', 'build:docs' ]);
	grunt.registerTask('build:js', [ 'concat', 'jshint', 'qunit', 'uglify' ]);
	grunt.registerTask('build:docs', [ 'copy' ]);
	grunt.registerTask('build:release', [ 'clean', 'build', 'compress' ]);
	grunt.registerTask('travis', [ 'concat', 'jshint', 'qunit' ]);

};
