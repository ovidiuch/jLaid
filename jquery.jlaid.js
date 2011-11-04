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
		delay: 200,
		stretch: false,
		responsive: false,
		debug: false
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
			that.presize();
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
	Laid.prototype.presize = function()
	{
		if(this.timeout)
		{
			window.clearTimeout(this.timeout);
		}
		var that = this;

		this.timeout = window.setTimeout(function()
		{
			that.resize(that.timeout = null);
		},
		this.options.delay);
	};
	Laid.prototype.resize = function()
	{
		this.log('jLaid: generating...');

		this.generate(this.time());
	};
	Laid.prototype.generate = function(time)
	{
		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();
		this.moves = 0;

		var items = $.makeArray(this.children), item, that = this;
		var block = {}, next;

		while(items.length)
		{
			block.space = this.INFINITE;

			for(var i = 0; i < items.length; i++)
			{
				next = that.next
				(
					$.data(items[i], 'width'), $(items[i]).outerHeight()
				);
				this.append(next);

				next.space = this.space();

				this.revert();

				if(next.space >= block.space)
				{
					continue;
				}
				block = that.copy(next);

				item = items[i];

				if(!that.options.optimize || !block.space)
				{
					break;
				}
			};
			this.append(block);

			$(item).css('left', block.x);
			$(item).css('top', block.y);

			items.splice(items.indexOf(item), 1);
		}
		that.log
		(
			'jLaid: generated in ' +
			(that.time() - time) + ' ms and ' + this.moves + ' moves'
		);
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
		this.moves++;
	};
	Laid.prototype.revert = function()
	{
		var block = this.stack.pop();

		this.each(function(i, line)
		{
			if(this.indexOf(block) != -1)
			{
				this.splice(this.indexOf(block), 1);
			}
		});
	};
	Laid.prototype.space = function() // maybe add space to right limit
	{
		var spaces = [], x, y, that = this;

		this.each(function(i, line)
		{
			if(!that.lines[i + 1])
			{
				return;
			}
			x = 0, y = this.y;

			this.each(function(j, block)
			{
				if(this.y > y)
				{
					return;
				}
				for(var k in spaces)
				{
					if(spaces[k].inner || spaces[k].y > this.y)
					{
						continue;
					}
					if(spaces[k].x >= this.x + this.width)
					{
						continue;
					}
					if(spaces[k].x + spaces[k].width <= this.x)
					{
						continue;
					}
					spaces[k].inner = true;
				}
				if(this.x - x)
				{
					spaces.push(
					{
						inner: false,
						x: x,
						y: line.y,
						width: this.x - x,
						height: that.lines[i + 1].y - line.y
					});
				}
				x = this.x + this.width;
			});
		});
		var total = 0;

		if(this.options.debug)
		{
			$('.jlaid-trace').remove();
		}
		for(var i in spaces)
		{
			if(!spaces[i].inner)
			{
				//continue;
			}
			total += spaces[i].width * spaces[i].height

			if(this.options.debug)
			{
				this.draw(spaces[i]);
			}
		}
		return total;
	};
	Laid.prototype.draw = function(space)
	{
		var dot, r, g, b;

		r = Math.round(Math.random() * 255);
		g = Math.round(Math.random() * 255);
		b = Math.round(Math.random() * 255);

		$(document.body).append($('<div class="jlaid-trace"></div').css(
		{
			position: 'absolute',
			left: space.x,
			top: space.y,
			width: space.width,
			height: space.height,
			background: 'rgb(' + r + ', ' + g + ', ' + b + ')'
		}));
	};
	Laid.prototype.copy = function(block)
	{
		var copy = {};

		for(var i in block)
		{
			if(block.hasOwnProperty(i))
			{
				copy[i] = block[i];
			}
		}
		return copy;
	};
	Laid.prototype.log = function(message)
	{
		if(this.options.debug)
		{
			console.log(message);
		}
	};
	Laid.prototype.time = function()
	{
		return new Date().getTime();
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

/* Array.indexOf */

if(!Array.prototype.indexOf)
{
	Array.prototype.indexOf = function(obj, start)
	{
		for(var i = (start || 0), n = this.length; i < n; i++)
		{
			if(this[i] === obj)
			{
				return i;
			}
		}
		return -1;
	};
}