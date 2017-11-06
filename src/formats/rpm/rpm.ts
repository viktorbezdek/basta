import {defineMIME, defineMode} from '../index';

defineMode('rpm-changes', () => {
    const headerSeperator = /^-+$/;
    const headerLine = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)  ?\d{1,2} \d{2}:\d{2}(:\d{2})? [A-Z]{3,4} \d{4} - /;
    const simpleEmail = /^[\w+.-]+@[\w.-]+/;

    return {
        token: stream => {
            if (stream.sol()) {
                if (stream.match(headerSeperator)) {
                    return 'tag';
                }
                if (stream.match(headerLine)) {
                    return 'tag';
                }
            }
            if (stream.match(simpleEmail)) {
                return 'string';
            }
            stream.next();
            return null;
        }
    };
});

defineMIME('text/x-rpm-changes', 'rpm-changes');

// Quick and dirty spec file highlighting

defineMode('rpm-spec', () => {
    const arch = /^(i386|i586|i686|x86_64|ppc64le|ppc64|ppc|ia64|s390x|s390|sparc64|sparcv9|sparc|noarch|alphaev6|alpha|hppa|mipsel)/;

    const preamble = /^[a-zA-Z0-9()]+:/;
    const section = /^%(debug_package|package|description|prep|build|install|files|clean|changelog|preinstall|preun|postinstall|postun|pretrans|posttrans|pre|post|triggerin|triggerun|verifyscript|check|triggerpostun|triggerprein|trigger)/;
    const control_flow_complex = /^%(ifnarch|ifarch|if)/; // rpm control flow macros
    const control_flow_simple = /^%(else|endif)/; // rpm control flow macros
    const operators = /^(\!|\?|\<\=|\<|\>\=|\>|\=\=|\&\&|\|\|)/; // operators in control flow macros

    return {
        startState: () => {
            return {
                controlFlow: false,
                macroParameters: false,
                section: false
            };
        },
        token: (stream, state) => {
            const ch = stream.peek();
            if (ch === '#') {
                stream.skipToEnd();
                return 'comment';
            }

            if (stream.sol()) {
                if (stream.match(preamble)) {
                    return 'header';
                }
                if (stream.match(section)) {
                    return 'atom';
                }
            }

            if (stream.match(/^\$\w+/)) {
                return 'def';
            } // Variables like '$RPM_BUILD_ROOT'
            if (stream.match(/^\$\{\w+\}/)) {
                return 'def';
            } // Variables like '${RPM_BUILD_ROOT}'

            if (stream.match(control_flow_simple)) {
                return 'keyword';
            }
            if (stream.match(control_flow_complex)) {
                state.controlFlow = true;
                return 'keyword';
            }
            if (state.controlFlow) {
                if (stream.match(operators)) {
                    return 'operator';
                }
                if (stream.match(/^(\d+)/)) {
                    return 'number';
                }
                if (stream.eol()) {
                    state.controlFlow = false;
                }
            }

            if (stream.match(arch)) {
                if (stream.eol()) {
                    state.controlFlow = false;
                }
                return 'number';
            }

            // Macros like '%make_install' or '%attr(0775,root,root)'
            if (stream.match(/^%[\w]+/)) {
                if (stream.match(/^\(/)) {
                    state.macroParameters = true;
                }
                return 'keyword';
            }
            if (state.macroParameters) {
                if (stream.match(/^\d+/)) {
                    return 'number';
                }
                if (stream.match(/^\)/)) {
                    state.macroParameters = false;
                    return 'keyword';
                }
            }

            // Macros like '%{defined fedora}'
            if (stream.match(/^%\{\??[\w \-\:\!]+\}/)) {
                if (stream.eol()) {
                    state.controlFlow = false;
                }
                return 'def';
            }

            //TODO: Include bash script sub-parser (CodeMirror supports that)
            stream.next();
            return null;
        }
    };
});

defineMIME('text/x-rpm-spec', 'rpm-spec');

