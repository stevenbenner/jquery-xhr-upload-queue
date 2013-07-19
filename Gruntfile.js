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
			dist: [ '<%= buildpath %>' ],
			temp: [ '<%= buildpath %>/temp/' ]
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
			options: {
				stripBanners: true
			},
			core: {
				src: [
					'src/core.js',
					'src/filequeue.js',
					'src/fileupload.js',
					'src/utility.js'
				],
				dest: '<%= buildpath %>/temp/core.js'
			},
			dist: {
				src: [
					'src/intro.js',
					'<%= buildpath %>/temp/core.js',
					'src/outro.js'
				],
				dest: '<%= buildpath %>/<%= files.cat %>',
				options: {
					banner: '<%= banner %>'
				}
			}
		},
		indent: {
			core: {
				src: [ '<%= buildpath %>/temp/core.js' ],
				dest: '<%= buildpath %>/temp/core.js',
				options: {
					style: 'tab',
					change: 1
				}
			}
		},
		qunit: {
			files: [ 'test/index.html' ]
		},
		uglify: {
			dist: {
				src: [ '<%= buildpath %>/<%= files.cat %>' ],
				dest: '<%= buildpath %>/<%= files.min %>',
				options: {
					banner: '<%= banner %>',
					report: 'gzip'
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
				files: [ 'Gruntfile.js', '.jshintrc' ],
				tasks: [ 'jshint:grunt' ]
			},
			src: {
				files: [ 'src/**/*.js' ],
				tasks: [ 'concat:core', 'indent', 'concat:dist', 'clean:temp', 'jshint:dist', 'qunit' ]
			},
			srcjshint: {
				files: [ 'src/.jshintrc' ],
				tasks: [ 'concat:core', 'indent', 'concat:dist', 'clean:temp', 'jshint:dist' ]
			},
			tests: {
				files: [ 'test/**/*.js' ],
				tasks: [ 'jshint:tests', 'concat:core', 'indent', 'concat:dist', 'clean:temp', 'qunit' ]
			},
			testsjshint: {
				files: [ 'test/.jshintrc' ],
				tasks: [ 'jshint:tests' ]
			}
		}
	});

	// force unix style line endings
	grunt.util.linefeed = '\n';

	// load grunt plugins
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-indent');

	// register grunt tasks
	grunt.registerTask('default', [ 'build:js' ]);
	grunt.registerTask('build', [ 'build:js', 'build:docs' ]);
	grunt.registerTask('build:js', [ 'concat:core', 'indent', 'concat:dist', 'clean:temp', 'jshint', 'qunit', 'uglify' ]);
	grunt.registerTask('build:docs', [ 'copy' ]);
	grunt.registerTask('build:release', [ 'clean:dist', 'build', 'compress' ]);
	grunt.registerTask('travis', [  'concat:core', 'indent', 'concat:dist', 'clean:temp', 'jshint', 'qunit' ]);

};
