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

		options = Laid.args(options, Laid.defaults);

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
		debug: false,
		delay: 200,
		duration: 0.4,
		stretch: false,
		responsive: false,
		transition: true,
		wait: false
	};
	Laid.INFINITY = 999999;

	Laid.args = function(block, defaults)
	{
		for(var i in defaults)
		{
			if(!defaults.hasOwnProperty(i))
			{
				continue;
			}
			if(block[i] === undefined)
			{
				block[i] = defaults[i];
			}
		}
		return block;
	};

	/* Laid prototype */

	Laid.prototype.init = function()
	{
		$(this.wrapper).css('position', 'relative');

		this.children.each(function()
		{
			var size = $.data(this, 'size',
			{
				width: $(this).outerWidth(),
				height: $(this).outerHeight()
			});
			$.data(this, 'padding',
			{
				width: size.width - $(this).width(),
				height: size.height - $(this).height()
			});
		});
		this.children.css('position', 'absolute');

		var that = this;

		$(window).resize(function()
		{
			that.presize();
		});
		this.refresh(true);
	};
	Laid.prototype.update = function(options, handle)
	{
		var o = this.options;

		if($.inArray(handle, $.makeArray(this.children)) != -1)
		{
			if(typeof($.data(handle, 'options')) != 'object')
			{
				$.data(handle, 'options', {});
			}
			o = $.data(handle, 'options');
		}
		else if(handle && handle != this.wrapper)
		{
			return;
		}
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
	Laid.prototype.presize = function()
	{
		if(this.timeout)
		{
			window.clearTimeout(this.timeout);
		}
		var that = this;

		this.timeout = window.setTimeout(function()
		{
			that.refresh(that.timeout = null);
		},
		this.option('delay'));
	};
	Laid.prototype.focus = function(args)
	{
		if(!args.child)
		{
			return;
		}
		if(typeof(args.child) == 'number')
		{
			args.child = this.children[args.child - 1];
		}
		if($.inArray(args.child, $.makeArray(this.children)) == -1)
		{
			return;
		}
		var base = new Block(args.child);

		base.center = false;

		var block = Laid.args(args, base);

		if(block.center)
		{
			block.x -= (block.width - base.width) / 2;
			block.y -= (block.height - base.height) / 2;
		}
		block.x = Math.max(block.x, 0);
		block.x = Math.min(block.x, this.width - block.width);
		block.y = Math.max(block.y, 0);

		this.refresh(false, block);
	};
	Laid.prototype.refresh = function(init, focus)
	{
		var t = time(), next;

		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();

		if(focus)
		{
			this.append(focus);
		}
		for(var i = 0, c; i < this.children.length; i++)
		{
			if(focus && this.children[i] == focus.child)
			{
				this.set(focus.child, focus, init);

				continue;
			}
			c = $(this.children[i]);

			this.append(next = this.next
			(
				c.outerWidth(), c.outerHeight()
			));
			this.set(this.children[i], next, init);
		};
		$(this.wrapper).height(this.lines[this.lines.length - 1].y);

		if(this.option('debug'))
		{
			this.print(time() - t);
		}
	};
	Laid.prototype.next = function(width, height)
	{
		var next = new Block(), that = this;

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

		this.stack.push($.extend({}, block));

		this.insert(block.y);
		this.insert(block.y + block.height);

		for(var k = 0; k < this.stack.length; k++)
		{
			this.each(function(i, line)
			{
				if(that.inline(that.stack[k], i))
				{
					this.insert(that.stack[k]);
				}
			});
		}
	};
	Laid.prototype.inline = function(block, i)
	{
		var line = this.lines[i];

		if(line.y >= block.y + block.height)
		{
			return false;
		}
		if(line.y < block.y)
		{
			if(line.width >= block.x + block.width)
			{
				return false;
			}
			while(this.lines[i++].y < block.y)
			{
				if(this.lines[i].width > block.x + block.width)
				{
					return false;
				}
			}
		}
		return true;
	};
	Laid.prototype.insert = function(y)
	{
		var index = 0;

		this.each(function(i, line)
		{
			if(this.y >= y)
			{
				if(this.y == y)
				{
					index = -1;
				}
				return;
			}
			index = i + 1;
		});
		if(index != -1)
		{
			this.lines.splice(index, 0, new Line(y));
		}
	};
	Laid.prototype.set = function(child, block, init)
	{
		var base = new Block(child);

		if(base.x == block.x
		&& base.y == block.y
		&& base.width == block.width
		&& base.height == block.height)
		{
			return;
		}
		var padding = $.data(child, 'padding');

		var transition = this.option('transition', child);

		if(!transition || init)
		{
			$(child).css(
			{
				left: block.x,
				top: block.y,
				width: block.width - padding.width,
				height: block.height - padding.height
			});
			return;
		}
		var x = block.x - base.x;
		var y = block.y - base.y;
		var width = block.width - base.width;
		var height = block.height - base.height;

		// update child $.data

		var duration = this.option('duration', child);

		new Animation(duration, transition, function(ratio)
		{
			$(child).css(
			{
				left: base.x + (x * ratio),
				top: base.y + (y * ratio),
				width: base.width + (width * ratio) - padding.width,
				height: base.height + (height * ratio) - padding.height
			});
		});
	};
	Laid.prototype.print = function(time)
	{
		var that = this;

		this.each(function(i, line)
		{
			that.log
			(
				'line #' + (i + 1) + ' [' +
				this.y + ' ' +
				this.width + ']'
			);
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
		that.log('built in ' + time + 'ms');
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

		this.width = 0;
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
			if(block.x + block.width > this.width)
			{
				this.width = block.x + block.width;
			}
			this.splice(index, 0, block);
		}
	};

	/* Block constructor */

	var Block = function(child)
	{
		if(!child)
		{
			this.x = this.y = Laid.INFINITY;

			return;
		}
		var c = $(child), position = c.position();

		this.x = position.left;
		this.y = position.top;

		this.width = c.outerWidth();
		this.height = c.outerHeight();
	}

	/* Animation constructor */

	var Animation = function(duration, transition, callback)
	{
		this.b = (this.a = time()) + (duration * 1000);

		if(typeof(transition) != 'function')
		{
			transition = Animation.linear;
		}
		this.transition = transition;

		this.callback = callback || function(){};

		Animation.push(this);
	};

	/* Animation static */

	Animation.stack = [];

	Animation.init = function()
	{
		if(this.interval)
		{
			window.clearInterval(this.interval);
		}
		var that = this;

		this.interval = window.setInterval(function()
		{
			that.frame();
		},
		13);
	};
	Animation.push = function(animation)
	{
		if(!this.interval)
		{
			this.init();
		}
		this.stack.push(animation);
	};
	Animation.frame = function(x, t)
	{
		if(x != undefined)
		{
			this.stack.splice(x, 1);
		}
		t = t || time();

		for(var i = x || 0; i < this.stack.length; i++)
		{
			if(!this.stack[i].frame(t))
			{
				this.frame(i, t);

				return;
			}
		}
	};
	Animation.linear = function(current, total)
	{
		return current / total;
	};

	/* Animation prototype */

	Animation.prototype.frame = function(time)
	{
		var ratio = Math.min(1, this.transition
		(
			time - this.a, this.b - this.a
		));
		this.callback(ratio);

		return ratio < 1;
	};

	/* time */

	var time = function()
	{
		return new Date().getTime();
	};

	/* plugin */

	$.fn.laid = function(options)
	{
		var plugin, methods =
		[
			'init', 'refresh', 'focus'
		];
		return (plugin = function(query, args)
		{
			if(typeof(query) == 'string')
			{
				if($.inArray(query, methods) != -1)
				{
					if(!$.isArray(args))
					{
						args = [args];
					}
					$(this).each(function()
					{
						var laid = $.data(this, 'laid');

						laid[query].apply(laid, args);
					});
					return this;
				}
				query = this.closest(query).add(this.find(query));
			}
			else if(query == null)
			{
				this.laid = plugin;
			}
			args = args || {};

			(query || this).each(function()
			{
				if(!$.data(this, 'laid'))
				{
					return new Laid(this, $.extend({}, args));
				}
				return $.data(this, 'laid').update(args, this);
			});
			return this;
		})
		.call(this, null, options);
	};
})
(jQuery, window, document);