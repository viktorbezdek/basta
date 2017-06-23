import {defineMIME, defineMode} from '../index';

defineMode('cmake', function() {
    const variable_regex = /({)?[a-zA-Z0-9_]+(})?/;

    function tokenString(stream, state) {
        let current, prev, found_var = false;
        while (!stream.eol() && (current = stream.next()) != state.pending) {
            if (current === '$' && prev != '\\' && state.pending == '"') {
                found_var = true;
                break;
            }
            prev = current;
        }
        if (found_var) {
            stream.backUp(1);
        }
        state.continueString = current != state.pending;
        return 'string';
    }

    function tokenize(stream, state) {
        const ch = stream.next();

        // Have we found a variable?
        if (ch === '$') {
            if (stream.match(variable_regex)) {
                return 'variable-2';
            }
            return 'variable';
        }
        // Should we still be looking for the end of a string?
        if (state.continueString) {
            // If so, go through the loop again
            stream.backUp(1);
            return tokenString(stream, state);
        }
        // Do we just have a function on our hands?
        // In 'cmake_minimum_required (VERSION 2.8.8)', 'cmake_minimum_required' is matched
        if (stream.match(/(\s+)?\w+\(/) || stream.match(/(\s+)?\w+\ \(/)) {
            stream.backUp(1);
            return 'def';
        }
        if (ch == '#') {
            stream.skipToEnd();
            return 'comment';
        }
        // Have we found a string?
        if (ch == "'" || ch == '"') {
            // Store the type (single or double)
            state.pending = ch;
            // Perform the looping function to find the end
            return tokenString(stream, state);
        }
        if (ch == '(' || ch == ')') {
            return 'bracket';
        }
        if (ch.match(/[0-9]/)) {
            return 'number';
        }
        stream.eatWhile(/[\w-]/);
        return null;
    }

    return {
        startState: function() {
            return {
                inDefinition: false,
                inInclude: false,
                continueString: false,
                pending: false
            };
        },
        token: function(stream, state) {
            if (stream.eatSpace()) return null;
            return tokenize(stream, state);
        }
    };
});

defineMIME('text/x-cmake', 'cmake');

