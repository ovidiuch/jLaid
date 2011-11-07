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
		debug: false,
		delay: 200,
		duration: 0.4,
		stretch: false,
		responsive: false,
		transition: true,
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
	Laid.prototype.update = function(options, handle)
	{
		var o = this.options;

		if($.makeArray(this.children).indexOf(handle) != -1)
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
	Laid.prototype.refresh = function(init, focused)
	{
		this.log('building...');

		var t = time();

		this.lines = [ new Line() ];
		this.stack = [];
		this.width = $(this.wrapper).width();

		var next, that = this;

		if(focused)
		{
			this.append(focused);
		}
		for(var i = 0, c; i < this.children.length; i++)
		{
			if(focused && this.children[i] == focused.child)
			{
				this.set(focused.child, focused, init);

				continue;
			}
			c = $(this.children[i]);

			this.append(next = that.next
			(
				c.outerWidth(), c.outerHeight()
			));
			this.set(this.children[i], next, init);
		};
		$(this.wrapper).height(this.lines[this.lines.length - 1].y);

		if(!this.option('debug'))
		{
			return;
		}
		t = time() - t;

		this.each(function(i, line)
		{
			that.log
			(
				'line #' + (i + 1) + ' [' + this.y + ' ' + this.width + ']'
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
		that.log('built in ' + t + 'ms');
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

		this.line(block.y);
		this.line(block.y + block.height);

		for(var k = 0, s; k < this.stack.length; k++)
		{
			s = this.stack[k];

			this.each(function(i, line)
			{
				if(this.y >= s.y + s.height)
				{
					return;
				}
				if(this.y < s.y)
				{
					if(this.width >= s.x + s.width)
					{
						return;
					}
					var j = i;

					while(that.lines[j++].y < s.y)
					{
						if(that.lines[j].width > s.x + s.width)
						{
							return;
						}
					}
				}
				this.insert(s);
			});
		}
	};
	Laid.prototype.line = function(y)
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
		var base = $(child).position();

		base.width = $(child).width();
		base.height = $(child).height();

		if(base.left == x && base.top == y)
		{
			//return;
		}
		var transition = this.option('transition', child);

		if(!transition || init)
		{
			$(child).css({ left: block.x, top: block.y });

			return;
		}
		var duration = this.option('duration', child);

		var x = block.x - base.left;
		var y = block.y - base.top;

		var padding = $.data(child, 'padding');

		var width = block.width - base.width - padding.width;
		var height = block.height - base.height - padding.height;

		// update child $.data

		new Animation(duration, transition, function(ratio)
		{
			$(child).css(
			{
				left: base.left + (x * ratio),
				top: base.top + (y * ratio),
				width: base.width + (width * ratio),
				height: base.height + (height * ratio)
			});
		});
	};
	Laid.prototype.focus = function(child, width, height)
	{
		if(typeof(child) == 'number')
		{
			child = this.children[child - 1];
		}
		var c = $(child), block = { child: child };

		var position = c.position();

		var size = $.data(child, 'size');

		block.width = width;
		block.height = height;

		block.x = position.left - Math.round((width - size.width) / 2);
		block.y = position.top - Math.round((height - size.height) / 2);

		// handle when block is outside bounds

		this.refresh(false, block);
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
				if(methods.indexOf(query) != -1)
				{
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
					return new Laid(this, Laid.copy(args));
				}
				return $.data(this, 'laid').update(args, this);
			});
			return this;
		})
		.call(this, null, options);
	};
})
(jQuery, window, document);

/* Array.prototype.indexOf */

if(!Array.prototype.indexOf) // hmm, not good
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