// Math ceiling function with the default for of 2 digits
exports.ceil = function(f, digits)
{
	
	digits = typeof digits  !== 'undefined' ? digits : 2;
	
	var div = Math.pow(10 ,digits);
	if (f > 0)
	{        
		f = Math.ceil(f * div) /div;
	} else 
	{
		f = Math.floor(f *div) /div;
	}
	return parseFloat(f.toFixed(digits));
}

// Math floor function with default the set for 2 digits
exports.floor = function(f, digits)
{
	digits = typeof digits  !== 'undefined' ? digits : 2;
	var div = Math.pow(10 ,digits);
	if (f > 0)
	{
		f = Math.floor(f *div) /div;
	} else 
	{
		f = Math.ceil(f *div) /div;
	}
	return parseFloat(f.toFixed(digits));
}