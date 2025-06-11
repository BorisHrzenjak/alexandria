/**
 * Simple Markdown Parser for Alexandria
 * Supports basic markdown formatting: headers, bold, italic, lists, code blocks
 * Also highlights placeholder text in curly brackets {like this}
 */
const markdownParser = {
    /**
     * Parse markdown text to HTML
     * @param {string} text - Markdown text to parse
     * @return {string} HTML output
     */
    parse: function(text) {
        if (!text) return '';
        
        // Process code blocks first
        text = this.parseCodeBlocks(text);
        
        // Process headers
        text = this.parseHeaders(text);
        
        // Process lists
        text = this.parseLists(text);
        
        // Process inline formatting
        text = this.parseInlineFormatting(text);
        
        // Process links
        text = this.parseLinks(text);
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    },
    
    /**
     * Parse code blocks
     */
    parseCodeBlocks: function(text) {
        // Replace ```code``` blocks
        return text.replace(/```([^`]*?)```/g, function(match, code) {
            return '<pre><code>' + code.trim() + '</code></pre>';
        });
    },
    
    /**
     * Parse headers
     */
    parseHeaders: function(text) {
        // Replace # Header
        text = text.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        text = text.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        text = text.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
        text = text.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
        text = text.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
        text = text.replace(/^###### (.*?)$/gm, '<h6>$1</h6>');
        
        return text;
    },
    
    /**
     * Parse lists
     */
    parseLists: function(text) {
        // Replace unordered lists
        let inList = false;
        let listLines = text.split('\n');
        
        for (let i = 0; i < listLines.length; i++) {
            // Unordered list items
            if (listLines[i].match(/^\s*[\*\-\+]\s+/)) {
                let item = listLines[i].replace(/^\s*[\*\-\+]\s+/, '');
                
                if (!inList) {
                    listLines[i] = '<ul><li>' + item + '</li>';
                    inList = true;
                } else {
                    listLines[i] = '<li>' + item + '</li>';
                }
                
                // Check if next line is not a list item
                if (i === listLines.length - 1 || !listLines[i+1].match(/^\s*[\*\-\+]\s+/)) {
                    listLines[i] += '</ul>';
                    inList = false;
                }
            }
            // Ordered list items
            else if (listLines[i].match(/^\s*\d+\.\s+/)) {
                let item = listLines[i].replace(/^\s*\d+\.\s+/, '');
                
                if (!inList) {
                    listLines[i] = '<ol><li>' + item + '</li>';
                    inList = true;
                } else {
                    listLines[i] = '<li>' + item + '</li>';
                }
                
                // Check if next line is not a list item
                if (i === listLines.length - 1 || !listLines[i+1].match(/^\s*\d+\.\s+/)) {
                    listLines[i] += '</ol>';
                    inList = false;
                }
            }
        }
        
        return listLines.join('\n');
    },
    
    /**
     * Parse inline formatting
     */
    parseInlineFormatting: function(text) {
        // Bold: **text** or __text__
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
        
        // Italic: *text* or _text_
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/_(.*?)_/g, '<em>$1</em>');
        
        // Inline code: `code`
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Blockquotes
        text = text.replace(/^>\s*(.*?)$/gm, '<blockquote>$1</blockquote>');
        
        // Highlight placeholder text in curly brackets {like this}
        text = text.replace(/{([^{}]+)}/g, '<span class="placeholder">{$1}</span>');
        
        return text;
    },
    
    /**
     * Parse links
     */
    parseLinks: function(text) {
        // [text](url)
        return text.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    }
};
