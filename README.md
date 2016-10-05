# postcss-closest

[PostCSS] plugin to modify closest matching part of current selector

```css
/* Input example */
html > body p:closest(body with .index, html with .js)
{
	...
}
```

```css
/* Output example */
html.js > body.index p
{
	...
}
```

## Install

```
npm install --save-dev postcss-closest
```

## Usage

```js
postcss( [ require( 'postcss-closest' ) ] )
```

[PostCSS]: https://github.com/postcss/postcss
