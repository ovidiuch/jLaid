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
		this.lines = { 0: {} };
		this.stack = [];

		this.width = $(this.wrapper).width();

		var that = this;

		this.children.each(function()
		{
			var width = $.data(this, 'width');
			var inner = $.data(this, 'inner');

			var pos = that.next(width, $(this).outerHeight());

			$(this).css('left', pos[0]);
			$(this).css('top', pos[1]);
		});
		console.log(this.lines);
		console.log(this.stack);
	};
	Laid.prototype.next = function(width, height)
	{
		var pos = [0, Laid.INFINITE];

		for(var i in this.lines)
		{
			if(i > pos[1])
			{
				continue;
			}
			if(this.empty(this.lines[i]))
			{
				return this.create(0, i, width, height);
			}
			for(var j in this.lines[i])
			{
				if(this.check(j, i, width, height))
				{
					pos = this.create(j, i, width, height);
				}
			}
		}
		return pos;
	}
	Laid.prototype.check = function(x, y, width, height)
	{
		x = Number(x);
		y = Number(y);

		if(x + width > this.width)
		{
			return false;
		}
		for(var i in this.stack)
		{
			if(this.stack[i].x + this.stack[i].width <= x)
			{
				continue;
			}
			if(this.stack[i].x >= x + width)
			{
				continue;
			}
			if(this.stack[i].y + this.stack[i].height <= y)
			{
				continue;
			}
			if(this.stack[i].y >= y + height)
			{
				continue;
			}
			return false;
		}
		return true;
	};
	Laid.prototype.create = function(x, y, width, height)
	{
		x = Number(x);
		y = Number(y);

		if(!this.lines[y + height])
		{
			this.lines[y + height] = { };
		}
		this.lines[y][x + width] = true;

		// check already existing higher Ys to inherit
		// check already existing lower Ys to transfer

		/*for(var i in this.lines[i])
		{
			for(j in this.lines[i])
			{
				this.lines[i][j] = true;
			}
		}*/
		this.stack.push({ x: x, y: y, width: width, height: height });

		return [x, y];
	};
	Laid.prototype.empty = function(obj)
	{
		for(var k in obj)
		{
			if(obj.hasOwnProperty(k))
			{
				return false;
			}
		}
		return true;
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