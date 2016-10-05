var postcss = require( 'postcss' );
var parser = require( 'postcss-selector-parser' );

/**
 * Selector property name
 */
var PROPERTY_NAME = 'closest';

/**
 * PostCSS plugin to modify closest matching part of current selector
 * 
 * Availible options:
 * - `prefix` — Adds the prefix surrounded by dashes before the pseudo-class (default none).
 * 
 * @param options Options
 */
function main( options )
{
	options = options || {};
	
	/**
	 * Pseudo-class name
	 */
	var property = ':' + ( options.prefix ? '-' + options.prefix + '-' : '' ) + PROPERTY_NAME;
	
	return function ( root, result )
	{
		root.walkRules( processRules );
	};
	
	/**
	 * Process CSS rule
	 * 
	 * @param rule PostCSS node of CSS rule
	 */
	function processRules( rule )
	{
		var selector = parser( transformSelectors ).process( rule.selector ).result;
		
		if ( selector !== rule.selector )
		{
			rule.selector = selector;
		}
	}
	
	/**
	 * Transform CSS rule selectors
	 * 
	 * @param selectors SelectorParser node of selectors
	 */
	function transformSelectors( selectors )
	{
		var selectorIndex = -1;
		var selector;
		
		while ( selector = selectors.nodes[++selectorIndex] )
		{
			var nodeIndex = -1;
			var node;
			
			while ( node = selector.nodes[++nodeIndex] )
			{
				if (
					( node.type === 'pseudo' )
					&& ( node.value === property )
				)
				{
					nodeIndex += processProperty( selector, nodeIndex, node.nodes ) - 1;
					node.remove();
				}
			}
		}
	}
}

/**
 * Process selector property of this plugin
 * 
 * @param selector SelectorParser node of selector with this property within
 * @param nodeIndex Index of this property in selector
 * @param propertyNodes Internal nodes of this property
 * @returns Position offset in selector after modifications
 */
function processProperty( selector, nodeIndex, propertyNodes )
{
	var STATE_SKIP = 0;
	var STATE_SELECTOR = 1;
	var STATE_ADDONS = 2;
	var STATE_DONE = 3;
	
	var subSelectorIndex = -1;
	var subSelector;
	
	var offset = 0;
	
	while ( subSelector = propertyNodes[++subSelectorIndex] )
	{
		// Internal selectors of the propery
		
		var subNodeIndex = -1;
		var subNode;
		var state = STATE_SELECTOR;
		var propertySelectorParts = [];
		var propertyAddons = [];
		var withFound = false;
		
		subNodes:
		while ( subNode = subSelector.nodes[++subNodeIndex] )
		{
			// Nodes of internal selector
			
			if ( subNode.type === 'combinator' )
			{
				switch ( state )
				{
					case STATE_SELECTOR:
						state = STATE_SKIP;
						break;
					case STATE_ADDONS:
						state = STATE_DONE;
						break subNodes;
					case STATE_SKIP:
						if ( withFound )
						{
							state = STATE_ADDONS;
						}
						break;
				}
				
				continue;
			}
			
			if (
				( subNode.type === 'tag' )
				&& ( subNode.value === 'with' )
			)
			{
				withFound = true;
			}
			
			switch ( state )
			{
				case STATE_SELECTOR:
					propertySelectorParts.push( subNode );
					break;
				case STATE_ADDONS:
					propertyAddons.push( subNode );
					break;
			}
		}
		
		if (
			( propertySelectorParts.length === 0 )
			|| ( propertyAddons.length === 0 )
		)
		{
			continue;
		}
		
		var matchIndex = indexOfMatchingSelector( selector, nodeIndex, propertySelectorParts );
		
		if ( matchIndex !== -1 )
		{
			appendToSelector( selector, matchIndex, propertyAddons );
			
			offset += propertyAddons.length;
		}
	}
	
	return offset;
}

/**
 * Returns index of subselector that contain same nodes as required
 * 
 * @param selector SelectorParser node of selector with this property within
 * @param fromIndex Index to start from (to beginning of selector)
 * @param requiredNodes Array of nodes that must exist in subselector to match
 * @returns Index of matching subselector in selector, or -1
 */
function indexOfMatchingSelector( selector, fromIndex, requiredNodes )
{
	var nodeIndex = fromIndex + 1;
	var node;
	var requiredParts = nodesToStrings( requiredNodes );
	var leftParts = requiredParts.slice();
	var partIndex;
	
	while ( node = selector.nodes[--nodeIndex] )
	{
		if ( node.type === 'combinator' )
		{
			leftParts = requiredParts.slice();
			continue;
		}
		
		partIndex = leftParts.indexOf( String( node ).trim() );
		
		if ( partIndex !== -1 )
		{
			leftParts.splice( partIndex, 1 );
		}
		
		if ( leftParts.length === 0 )
		{
			return nodeIndex;
		}
	}
	
	return -1;
}

/**
 * Appends new nodes to subselector in selector
 * 
 * @param selector SelectorParser node of selector with this property within
 * @param index Index of any node of subselector in selector
 * @param parts Array of nodes to insert
 */
function appendToSelector( selector, index, parts )
{
	var nodeIndex = index;
	var node;
	
	while ( node = selector.nodes[++nodeIndex] )
	{
		if ( node.type === 'combinator' )
		{
			var partsIndex = -1;
			var part;
			
			while ( part = parts[++partsIndex] )
			{
				selector.insertBefore( node, part );
			}
			break;
		}
	}
}

/**
 * Convert array of nodes to array of trimmed string representation of that nodes
 * 
 * @param nodes Array of nodes
 * @returns Array of strings
 */
function nodesToStrings( nodes )
{
	var nodeIndex = -1;
	var strings = [];
	
	while ( node = nodes[++nodeIndex] )
	{
		strings.push( String( node ).trim() );
	}
	
	return strings;
}

/**
 * Plugin module
 */
module.exports = postcss.plugin(
	'postcss-closest',
	main
);
