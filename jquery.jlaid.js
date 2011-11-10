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
		scale: false,
		stretch: false,
		transition: true,
		wait: false
	};
	Laid.INFINITY = 999999;

	Laid.args = function(object, defaults, override)
	{
		for(var i in defaults)
		{
			if(!defaults.hasOwnProperty(i))
			{
				continue;
			}
			if(object[i] === undefined || override)
			{
				object[i] = defaults[i];
			}
		}
		return object;
	};

	/* Laid prototype */

	Laid.prototype.init = function()
	{
		$(this.wrapper).css('position', 'relative');

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
	Laid.prototype.reset = function()
	{
		this.lines = [ new Line() ];
		this.stack = [];
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
	Laid.prototype.focus = function(args, child)
	{
		if($.inArray(child, $.makeArray(this.children)) == -1)
		{
			return;
		}
		var next = Laid.args(new Block(child), args, true);

		var diff = new Block(child).diff(next);

		if(diff && next.center)
		{
			next.x -= diff.width / 2;
			next.y -= diff.height / 2;
		}
		next.x = Math.min(next.x, this.width - next.width);
		next.x = Math.max(next.x, 0);
		next.y = Math.max(next.y, 0);

		this.append(next);

		this.refresh(false);
	};
	Laid.prototype.refresh = function(init)
	{
		var t = time(), block, next;

		if(init)
		{
			this.reset();
		}
		this.width = $(this.wrapper).width();

		var child, c;

		for(var i = 0; i < this.children.length; i++)
		{
			c = $(child = this.children[i]), block = new Block(child);

			if((next = this.found(child)))
			{
				this.set(block, next, init);

				continue;
			}
			this.append(next = this.next
			(
				block.width, block.height
			));
			this.set(block, next, init);
		};
		$(this.wrapper).height(this.lines[this.lines.length - 1].y);

		if(this.option('debug'))
		{
			this.print(time() - t);
		}
		this.reset();
	};
	Laid.prototype.found = function(child)
	{
		for(var i = 0; i < this.stack.length; i++)
		{
			if(this.stack[i].child == child)
			{
				return this.stack[i];
			}
		}
		return false;
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

		//this.stack.push($.extend({}, block)); // why?
		this.stack.push(block);

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
	Laid.prototype.set = function(block, next, init)
	{
		var diff = block.diff(next), that = this;

		if(!diff && !init)
		{
			return;
		}
		block.update(next);

		var transition = this.option('transition', block.child);

		if(!transition || init)
		{
			this.assign
			(
				block.child,
				block.x,
				block.y,
				block.width - block.h,
				block.height - block.v
			);
			return;
		}
		var duration = this.option('duration', block.child);

		new Animation(duration, transition, function(ratio)
		{
			ratio = 1 - ratio;

			that.assign
			(
				block.child,
				block.x - (diff.x * ratio),
				block.y - (diff.y * ratio),
				block.width - (diff.width * ratio) - block.h,
				block.height - (diff.height * ratio) - block.v
			);
		});
	};
	Laid.prototype.assign = function(child, x, y, width, height)
	{
		$(child).css(
		{
			left: x, top: y, width: width, height: height
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
		if(!(this.child = child))
		{
			this.x = this.y = Laid.INFINITY;

			return;
		}
		if(!$.data(child, 'block'))
		{
			this.init();
		}
		this.self();
	};

	/* Block prototype */

	Block.prototype.init = function()
	{
		var b = {}, c = $(this.child), position = c.position();

		b.x = position.left;
		b.y = position.top;

		b.width = c.outerWidth();
		b.height = c.outerHeight();

		b.h = b.width - c.width();
		b.v = b.height - c.height();

		$.data(this.child, 'block', b);
	};
	Block.prototype.self = function()
	{
		var b = $.data(this.child, 'block');

		for(var i in b)
		{
			if(b.hasOwnProperty(i))
			{
				this[i] = b[i];
			}
		}
	};
	Block.prototype.diff = function(block)
	{
		var b = $.data(this.child, 'block'), diff = {};

		diff.x = block.x - b.x;
		diff.y = block.y - b.y;

		diff.width = block.width - b.width;
		diff.height = block.height - b.height;

		if(!diff.x
		&& !diff.y
		&& !diff.width
		&& !diff.height)
		{
			return false;
		}
		return diff;
	};
	Block.prototype.update = function(block)
	{
		var b = $.data(this.child, 'block');

		b.x = block.x;
		b.y = block.y;

		b.width = block.width;
		b.height = block.height;

		this.self();
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

	var go = function(method)
	{
		$(this).each(function()
		{
			var laid = $.data(this, 'laid');
			var args = $.makeArray(arguments);

			args.shift();

			laid[method].apply(laid, args);
		});
		return this;
	};
	var plugin;

	$.fn.laid = function(options)
	{
		return (plugin = function(query, args, method)
		{
			if(typeof(query) == 'string')
			{
				query = this.closest(query).add(this.find(query));
			}
			if(!query)
			{
				this.laid = plugin, this.go = go;
			}
			args = args || {};

			(query || this).each(function()
			{
				if(!$.data(this, 'laid'))
				{
					return new Laid(this, $.extend({}, args));
				}
				var laid = $.data(this, 'laid');

				if(method)
				{
					laid[method](args, this);
				}
				return laid.update(args, this);
			});
			return this;
		})
		.call(this, null, options);
	};
})
(jQuery, window, document);