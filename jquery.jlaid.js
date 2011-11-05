;(function($, window, document, undefined)
{
	/* Layout Grid constructor */

	var Laid = function(wrapper, options)
	{
		if(!(this.children = $(wrapper).find('> li')).length)
		{
			return;
		}
		var that = this;

		$(this.children).each(function()
		{
			$.data(this, 'laid', that);
		});
		$.data(wrapper, 'laid', this);

		for(var i in Laid.defaults)
		{
			if(options[i] === undefined)
			{
				options[i] = Laid.defaults[i];
			}
		}
		this.wrapper = wrapper;
		this.options = options;

		if(!this.option('wait'))
		{
			this.init();
		}
	};

	/* Laid static */

	Laid.defaults =
	{
		animate: true,
		debug: false,
		delay: 200,
		stretch: false,
		responsive: false,
		wait: false
	};
	Laid.INFINITE = 999999;

	Laid.copy = function(block)
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
	Laid.time = function()
	{
		return new Date().getTime();
	};

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
		this.resize(true);
	};
	Laid.prototype.option = function(name, child)
	{
		if(child)
		{
			var options = $.data(child, 'options') || {};

			if(options[name] !== undefined)
			{
				return options[name]
			};
		}
		return this.options[name];
	};
	Laid.prototype.update = function(child, options)
	{
		if(typeof($.data(child, 'options')) != 'object')
		{
			$.data(child, 'options', {});
		}
		var o = $.data(child, 'options');

		for(var i in options)
		{
			o[i] = options[i];
		}
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
		this.option('delay'));
	};
	Laid.prototype.resize = function(init)
	{
		this.log('generating...');

		this.generate(Laid.time(), Boolean(init));
	};
	Laid.prototype.generate = function(time, init)
	{
		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();

		var next, that = this;

		for(var i = 0, c; i < this.children.length; i++)
		{
			c = this.children[i];

			this.append(next = that.next
			(
				$.data(c, 'width'), $(c).outerHeight()
			));
			this.set(c, next.x, next.y, init);
		};
		if(!this.option('debug'))
		{
			return;
		}
		var t = Laid.time() - time;

		this.each(function(i, line)
		{
			that.log('line #' + (i + 1) + ' [' + line.y + ']');

			this.each(function(j, block)
			{
				that.log
				(
					'> #' + (j + 1) + ' [' +
					this.x + ' ' +
					this.y + ' ' +
					this.width + ' ' +
					this.height + ']'
				);
			});
		});
		that.log('generated in ' + t + 'ms');
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
				if(this.x > next.x && line.y == next.y)
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
			if(this.y >= y + height)
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

		this.stack.push(Laid.copy(block));

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
		for(var k = 0, s; k < this.stack.length; k++)
		{
			s = this.stack[k];

			this.each(function(i, line)
			{
				if(this.y >= s.y && this.y < s.y + s.height)
				{
					this.insert(s);
				}
			});
		}
	};
	Laid.prototype.set = function(child, x, y, init)
	{
		var animate = this.option('animate', child);

		if(typeof(animate) == 'function')
		{
			return animate.call(child, x, y, init);
		}
		if(animate && !init)
		{
			return $(child).stop().animate({ left: x, top: y });
		}
		return $(child).css({ left: x, top: y });
	};
	Laid.prototype.log = function(message)
	{
		if(this.option('debug'))
		{
			console.log('jLaid: ' + message);
		}
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
				index = j + 1;
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
		var plugin, init = function()
		{
			$(this).each(function()
			{
				$.data(this, 'laid').init();
			});
		};
		return (plugin = function(selection, options)
		{
			if(typeof(selection) == 'string')
			{
				selection = this.find(selection);
			}
			else if(!selection)
			{
				this.laid = plugin, this.init = init;
			}
			options = options || {};

			(selection || this).each(function()
			{
				if(!$.data(this, 'laid'))
				{
					return new Laid(this, options);
				}
				return $.data(this, 'laid').update(this, options);
			});
			return this;
		})
		.call(this, null, options);
	};
})
(jQuery, window, document);

/* Array.prototype.indexOf */

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