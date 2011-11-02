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

		this.init();
	};

	/* Laid static */

	Laid.defaults =
	{
		optimize: true,
		stretch: false,
		responsive: false
	};
	Laid.INFINITE = 999999;

	/* Laid prototype */

	Laid.prototype.init = function()
	{
		$(this.wrapper).css('position', 'relative');

		this.children.each(function()
		{
			$.data(this, 'width', $(this).outerWidth());
			$.data(this, 'inner', $(this).outerWidth() - $(this).width());
		});
		this.children.css('position', 'absolute');

		var that = this;

		$(window).resize(function()
		{
			that.resize();
		});
		this.resize();
	};
	Laid.prototype.each = function(callback)
	{
		for(var i = 0; i < this.lines.length; i++)
		{
			if(callback.call(this.lines[i], i, this.lines[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Laid.prototype.resize = function()
	{
		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();

		var items = $.makeArray(this.children), item, that = this;
		var block = {}, next;

		while(items.length)
		{
			block.x = block.y = this.INFINITE;

			for(var i = 0; i < items.length; i++)
			{
				next = that.next
				(
					$.data(items[i], 'width'), $(items[i]).outerHeight()
				);
				if(next.y >= block.y)
				{
					continue;
				}
				if(next.x >= block.x && next.y == block.y)
				{
					continue;
				}
				block = that.copy(next);
				item = items[i];

				if(!that.options.optimize || 1)
				{
					break;
				}
			};
			this.append(block);

			$(item).css('left', block.x);
			$(item).css('top', block.y);

			items.splice(items.indexOf(item), 1); // IE
		}
		console.log('space: ' + this.space());
	};
	Laid.prototype.next = function(width, height)
	{
		var next = { x: Laid.INFINITE, y: Laid.INFINITE, f: 0 }, that = this;

		this.each(function(i, line)
		{
			if(this.y > next.y)
			{
				return;
			}
			if(that.check(0, this.y, width, height))
			{
				next.x = 0;
				next.y = this.y;
			}
			this.each(function(j, block)
			{
				if(this.x > next.x && this.y == next.y)
				{
					return;
				}
				if(that.check(this.x + this.width, line.y, width, height))
				{
					next.x = this.x + this.width;
					next.y = line.y;
				}
			});
		});
		next.width = width;
		next.height = height;

		return next;
	};
	Laid.prototype.check = function(x, y, width, height)
	{
		if(x && x + width > this.width)
		{
			return false;
		}
		return this.each(function(i, line)
		{
			if(this.y > y + height)
			{
				return true;
			}
			return this.each(function(j, block)
			{
				if(x >= this.x + this.width)
				{
					return true;
				}
				if(x + width <= this.x)
				{
					return true;
				}
				if(y >= this.y + this.height)
				{
					return true;
				}
				if(y + height <= this.y)
				{
					return true;
				}
				return false;
			});
		});
	};
	Laid.prototype.append = function(block)
	{
		var index = 0, that = this;

		this.stack.push(this.copy(block));

		this.each(function(i, line)
		{
			if(this.y >= block.y + block.height)
			{
				if(this.y == block.y + block.height)
				{
					index = -1;
				}
				return;
			}
			index = i + 1;
		});
		if(index != -1)
		{
			this.lines.splice(index, 0, new Line(block.y + block.height));
		}
		for(var k = 0; k < this.stack.length; k++)
		{
			this.each(function(i, line)
			{
				if(this.y < that.stack[k].y + that.stack[k].height)
				{
					this.insert(that.stack[k]);
				}
			});
		}
	};
	Laid.prototype.space = function()
	{
		var space = 0, width = 0, x, y;

		this.each(function(i, line)
		{
			space += width/* * (this.y - y)*/;

			x = 0, y = this.y, width = 0;

			this.each(function(j, block)
			{
				if(this.y > y)
				{
					return;
				}
				// need to idenfity last blocks (vertically);

				width += this.x - x;

				if(this.x - x)
				{
					console.log('block: ' + this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height);
					console.log('width: ' + (this.x - x));
				}
				x = this.x + this.width;
			});
		});
		return space;
	};
	Laid.prototype.copy = function(block)
	{
		return(
		{
			x: block.x,
			y: block.y,
			width: block.width,
			height: block.height
		});
	};

	/* Line constructor */

	var Line = function(y)
	{
		this.y = y || 0;
	};

	/* Line prototype */

	Line.prototype = [];

	Line.prototype.each = function(callback)
	{
		for(var i = 0; i < this.length; i++)
		{
			if(callback.call(this[i], i, this[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Line.prototype.insert = function(block)
	{
		var index = 0;

		this.each(function(j)
		{
			if(this == block)
			{
				index = -1;

				return false;
			}
			if(this.x <= block.x)
			{
				index = j + 1; // maybe order by y
			}
			return true;
		});
		if(index != -1)
		{
			this.splice(index, 0, block);
		}
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