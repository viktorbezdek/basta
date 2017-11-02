import {defineMIME, defineMode} from '../index';

defineMode('turtle', function(config) {
    const indentUnit = config.indentUnit;
    let curPunc;

    function wordRegexp(words) {
        return new RegExp('^(?:' + words.join('|') + ')$', 'i');
    }

    const ops = wordRegexp([]);
    const keywords = wordRegexp(['@prefix', '@base', 'a']);
    const operatorChars = /[*+\-<>=&|]/;

    function tokenBase(stream, state) {
        const ch = stream.next();
        curPunc = null;
        if (ch === '<' && !stream.match(/^[\s\u00a0=]/, false)) {
            stream.match(/^[^\s\u00a0>]*>?/);
            return 'atom';
        } else if (ch === '"' || ch === "'") {
            state.tokenize = tokenLiteral(ch);
            return state.tokenize(stream, state);
        } else if (/[{}\(\),\.;\[\]]/.test(ch)) {
            curPunc = ch;
            return null;
        } else if (ch === '#') {
            stream.skipToEnd();
            return 'comment';
        } else if (operatorChars.test(ch)) {
            stream.eatWhile(operatorChars);
            return null;
        } else if (ch === ':') {
            return 'operator';
        } else {
            let word;
            stream.eatWhile(/[_\w\d]/);
            if (stream.peek() === ':') {
                return 'variable-3';
            } else {
                word = stream.current();

                if (keywords.test(word)) {
                    return 'meta';
                }

                if (ch >= 'A' && ch <= 'Z') {
                    return 'comment';
                } else {
                    return 'keyword';
                }
            }
        }
    }

    function tokenLiteral(quote) {
        return function(stream, state) {
            let escaped = false, ch;
            while ((ch = stream.next()) !== null) {
                if (ch === quote && !escaped) {
                    state.tokenize = tokenBase;
                    break;
                }
                escaped = !escaped && ch === '\\';
            }
            return 'string';
        };
    }

    function pushContext(state, type, col) {
        state.context = {prev: state.context, indent: state.indent, col: col, type: type};
    }

    function popContext(state) {
        state.indent = state.context.indent;
        state.context = state.context.prev;
    }

    return {
        startState: () => {
            return {
                tokenize: tokenBase,
                context: null,
                indent: 0,
                col: 0
            };
        },

        token: (stream, state) => {
            if (stream.sol()) {
                if (state.context && state.context.align === null) {
                    state.context.align = false;
                }
                state.indent = stream.indentation();
            }
            if (stream.eatSpace()) {
                return null;
            }
            const style = state.tokenize(stream, state);

            if (style !== 'comment' && state.context && state.context.align === null && state.context.type !== 'pattern') {
                state.context.align = true;
            }

            if (curPunc === '(') {
                pushContext(state, ')', stream.column());
            } else if (curPunc === '[') {
                pushContext(state, ']', stream.column());
            } else if (curPunc === '{') {
                pushContext(state, '}', stream.column());
            } else if (/[\]\}\)]/.test(curPunc)) {
                while (state.context && state.context.type === 'pattern') {
                    popContext(state);
                }
                if (state.context && curPunc === state.context.type) {
                    popContext(state);
                }
            } else if (curPunc === '.' && state.context && state.context.type === 'pattern') {
                popContext(state);
            } else if (/atom|string|variable/.test(style) && state.context) {
                if (/[\}\]]/.test(state.context.type)) {
                    pushContext(state, 'pattern', stream.column());
                } else if (state.context.type === 'pattern' && !state.context.align) {
                    state.context.align = true;
                    state.context.col = stream.column();
                }
            }

            return style;
        },

        indent: (state, textAfter) => {
            const firstChar = textAfter && textAfter.charAt(0);
            let context = state.context;
            if (/[\]\}]/.test(firstChar)) {
                while (context && context.type === 'pattern') {
                    context = context.prev;
                }
            }

            const closing = context && firstChar === context.type;
            if (!context) {
                return 0;
            } else if (context.type === 'pattern') {
                return context.col;
            } else if (context.align) {
                return context.col + (closing ? 0 : 1);
            } else {
                return context.indent + (closing ? 0 : indentUnit);
            }
        },

        lineComment: '#'
    };
});

defineMIME('text/turtle', 'turtle');

