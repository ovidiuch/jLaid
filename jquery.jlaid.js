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
	/* Layout Grid constructor */

	var Laid = function(wrapper, options)
	{
		if(!(this.children = $(wrapper).find('> li')).length)
		{
			return;
		}
		for(var i in Laid.defaults)
		{
			if(options[i] === undefined)
			{
				options[i] = Laid.defaults[i];
			}
		}
		this.wrapper = wrapper;
		this.options = options;

		var that = this;

		$(window).resize(function()
		{
			that.resize();
		});
		this.init();
	};

	/* static */

	Laid.defaults =
	{
		stretch: true,
		responsive: false
	};
	Laid.INFINITE = 999999;

	Laid.matrix = function(cols)
	{
		var matrix = [];

		for(var i = 0; i < cols; i++)
		{
			matrix[i] = [0, 0]; // ??
		}
		return matrix;
	};
	Laid.min = function(matrix, width, total) // not good
	{
		var j = 0, min = this.INFINITE;

		for(var i = 0; i < matrix.length; i++)
		{
			if(width > (total - matrix[i][0]))
			{
				break;
			}
			if(matrix[i + 1] && (matrix[i + 1][0] - matrix[i][0] < width))
			{
				continue;
			}
			if(matrix[i][1] < min)
			{
				j = i;
				min = matrix[i][1];
			}
		}
		console.log(j);
		return j;
		//return [j, matrix[j][1]];
	};

	/* prototype */

	Laid.prototype.init = function()
	{
		$(this.wrapper).css('position', 'relative');

		this.children.each(function()
		{
			$.data(this, 'width', $(this).outerWidth());
			$.data(this, 'inner', $(this).outerWidth() - $(this).width());
		});
		this.children.css('position', 'absolute');

		this.resize();
	};
	Laid.prototype.resize = function()
	{
		var matrix = Laid.matrix(this.children.length + 1);

		var total = $(this.wrapper).width();

		this.children.each(function()
		{
			var width = $.data(this, 'width');
			var inner = $.data(this, 'inner');

			var i = Laid.min(matrix, width, total);

			//$(this).css('width', width - inner); // only if stretch

			$(this).css('left', matrix[i][0]);
			$(this).css('top', matrix[i][1]);

			matrix[i + 1][0] += width;
			matrix[i][1] += $(this).outerHeight();
		});
		console.log(matrix);
	};

	/* plugin */

	$.fn.laid = function(options)
	{
		return this.each(function()
		{
			new Laid(this, options || {});
		});
	};
})
(jQuery, window, document);