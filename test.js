import postcss from 'postcss';
import test from 'ava';
import closest from './';

function run( tester, input, output, options = {} )
{
	return postcss( [ closest( options ) ] )
		.process( input )
		.then(
			result =>
			{
				tester.deepEqual( result.css, output );
				tester.deepEqual( result.warnings().length, 0 );
			}
		);
}

test(
	'Regular selector',
	tester => run(
		tester,
		'body p {margin:0;}',
		'body p {margin:0;}'
	)
);

test(
	'Find by tag and add class',
	tester => run(
		tester,
		'body p:closest(body with .index) {margin:0;}',
		'body.index p {margin:0;}'
	)
);

test(
	'Find by tag and class and add two classes',
	tester => run(
		tester,
		'body.index > p:closest(body.index with .lightbox.dark) {margin:0;}',
		'body.index.lightbox.dark > p {margin:0;}'
	)
);

test(
	'Find by tag and class and add pseudo-class',
	tester => run(
		tester,
		'main > div.test > div.other > p:closest(div.test with :hover) {margin:0;}',
		'main > div.test:hover > div.other > p {margin:0;}'
	)
);

test(
	'Two internal selectors in plugin pseudo-class',
	tester => run(
		tester,
		'html > body.index > p:closest(body.index with .lightbox.dark, html with .js) {margin:0;}',
		'html.js > body.index.lightbox.dark > p {margin:0;}'
	)
);

test(
	'Two selectors',
	tester => run(
		tester,
		'div.some > a:closest(div.some with :hover), div.other > a:closest(div.other with :hover) {margin:0;}',
		'div.some:hover > a, div.other:hover > a {margin:0;}'
	)
);

test(
	'Two rules',
	tester => run(
		tester,
		'div.some > a:closest(div.some with :hover) {margin:0;} div.other > a:closest(div.other with :hover) {margin:0;}',
		'div.some:hover > a {margin:0;} div.other:hover > a {margin:0;}'
	)
);

test(
	'Ingnoring content after combinator',
	tester => run(
		tester,
		'body p:closest(body with .index+.other) {margin:0;}',
		'body.index p {margin:0;}'
	)
);

test(
	'Do nothing if there is no `with`',
	tester => run(
		tester,
		'body p:closest(body .index) {margin:0;}',
		'body p {margin:0;}'
	)
);

test(
	'With prefix',
	tester => run(
		tester,
		'body p:-x-closest(body with .index) {margin:0;}',
		'body.index p {margin:0;}',
		{prefix: 'x'}
	)
);
