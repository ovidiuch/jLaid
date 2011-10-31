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

	/* Laid static */

	Laid.defaults =
	{
		stretch: true,
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

		var that = this;

		this.children.each(function()
		{
			var width = $.data(this, 'width');
			var inner = $.data(this, 'inner');

			var block = that.next(width, $(this).outerHeight());

			$(this).css('left', block.x);
			$(this).css('top', block.y);
		});
		//console.log(this.lines);
		//
		//console.log('lines ' + this.lines.length);
		//this.each(function(i)
		//{
		//	console.log(i + ' ' + this.y);
		//
		//	this.each(function(j)
		//	{
		//		console.log('	' + j + ' ' + this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height);
		//	});
		//});
	};
	Laid.prototype.next = function(width, height)
	{
		var next = { x: Laid.INFINITE, y: Laid.INFINITE }, that = this;

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
		return this.append(next.x, next.y, width, height);
	}
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
	Laid.prototype.append = function(x, y, width, height)
	{
		var block, index = 0, that = this;

		this.stack.push(block =
		{
			x: x, y: y, width: width, height: height
		});
		this.each(function(i, line)
		{
			if(this.y >= y + height)
			{
				if(this.y == y + height)
				{
					index = -1;
				}
				return;
			}
			index = i + 1;
		});
		if(index != -1)
		{
			this.lines.splice(index, 0, new Line(y + height));
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
		return block;
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