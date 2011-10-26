/*var layout = {};

layout.build = function(content)
{
	this.content = content;
	this.children = $(content).find('> li');

	if(!this.children.length)
	{
		return false;
	}
	if(!this.unit)
	{
		var first = this.children.first();

		this.unit = first.outerWidth();
		this.padding = first.outerWidth() - first.width();
	}
	this.width = $(content).width();

	var cols = Math.round(this.width / this.unit);

	this.position(Math.floor(this.width / cols), cols);
};

layout.position = function(unit, cols)
{
	var that = this;
	var matrix = this.emptyMatrix(cols);

	$(this.children).each(function()
	{
		var col = that.min(matrix);

		$(this).css('width', unit - that.padding);

		$(this).css('position', 'absolute');
		$(this).css('top', col[1]);
		$(this).css('left', col[0] * unit);

		matrix[col[0]] += $(this).outerHeight();
	});

	$(this.content).height(this.max(matrix));
};

layout.emptyMatrix = function(cols)
{
	var matrix = [];
	for(var i = 0; i < cols; i++)
	{
		matrix[i] = 0;
	}
	return matrix;
};

layout.min = function(matrix)
{
	var j = -1, min = 999999;
	for(var i = 0; i < matrix.length; i++)
	{
		if(matrix[i] < min)
		{
			j = i;
			min = matrix[i];
		}
	}
	return j != -1 ? [j, min] : [0, 0];
};

layout.max = function(matrix)
{
	var max = 0;
	for(var i = 0; i < matrix.length; i++)
	{
		if(matrix[i] > max)
		{
			max = matrix[i];
		}
	}
	return max;
};*/

;(function($, window, document, undefined)
{
	var Laid = function(wrapper, options)
	{
		this.wrapper = wrapper;
		this.options = options;

		if(!(this.children = $(wrapper).find('> li')).length)
		{
			return;
		}
	};
	Laid.defaults =
	{
		stretch: true,
		responsive: false
	};
	//Laid.prototype.

	$.fn.jLaid = function(options)
	{
		return this.each(function()
		{
			new Laid(this, options || {});
		});
	};
})
(jQuery, window, document);