;(function($, window, document, undefined)
{
	/* Layout Grid constructor */

	var Laid = function(wrapper, options)
	{
		$.data(wrapper, 'laid', this);

		this.wrapper = wrapper;
		this.options = Laid.args(options, Laid.defaults);

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

	Laid.args = function(object, args, override)
	{
		for(var i in args)
		{
			if(!args.hasOwnProperty(i))
			{
				continue;
			}
			if(object[i] === undefined || override)
			{
				object[i] = args[i];
			}
		}
		return object;
	};

	/* Laid prototype */

	Laid.prototype.items = [];

	Laid.prototype.init = function(child)
	{
		var that = this, block;

		$(this.wrapper).css('position', 'relative');

		(this.children = $(this.wrapper).find('> li')).each(function(i)
		{
			$.data(this, 'laid', that);

			$(this).css('position', 'absolute');

			if(!that.find(this))
			{
				that.items.splice(i, 0, block = new Block(this, that));

				if(this == child)
				{
					block.insert = true;
				}
			}
		});
		$(window).resize(function()
		{
			that.presize();
		});
		this.refresh(!Boolean(child));
	};
	Laid.prototype.update = function(options, handle)
	{
		var o = this.options;

		if($.inArray(handle, $.makeArray(this.children)) != -1) // maybe wrapper.find() ?
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
		Laid.args(o, options, true);
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
	Laid.prototype.find = function(child)
	{
		for(var i in this.items)
		{
			if(this.items[i].child == child)
			{
				return this.items[i];
			}
		}
		return false;
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
		var block = this.find(child);

		if(!block)
		{
			return;
		}
		var next = Laid.args(block.next, args, true);

		var diff = block.diff(block.next);

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
	Laid.prototype.blur = function(args, child)
	{
		var block = this.find(child);

		if(!block)
		{
			return;
		}
		Laid.args(block.next, block.original, true);

		this.refresh(false);
	};
	Laid.prototype.insert = function(baby, child)
	{
		var block = this.find(child);

		if(block)
		{
			$(child).after(baby);
		}
		else if(child == this.wrapper)
		{
			$(this.wrapper).prepend(baby);
		}
		this.init(baby);
	};
	Laid.prototype.refresh = function(init)
	{
		var t = time();

		if(init)
		{
			this.reset();
		}
		this.width = $(this.wrapper).width();

		for(var i = 0, block; i < this.items.length; i++)
		{
			block = this.items[i];

			if($.inArray(block.next, this.stack) == -1)
			{
				this.append(this.next(block.next));
			}
			block.set(init);
		};
		$(this.wrapper).height(this.lines[this.lines.length - 1].y);

		if(this.option('debug'))
		{
			this.print(time() - t);
		}
		this.reset();
	};
	Laid.prototype.next = function(next)
	{
		var sibling, valid, that = this;

		next.x = next.y = Laid.INFINITY;

		this.each(function(i, line)
		{
			if(this.y > next.y)
			{
				return;
			}
			if(!this.width || that.check(0, this.y, next.width, next.height))
			{
				next.x = 0;
				next.y = this.y;
			}
			this.each(function(j, box)
			{
				while((sibling = line[++j]))
				{
					if(sibling.x > this.x + this.width)
					{
						break;
					}
					if(sibling.y == this.y)
					{
						return;
					}
				}
				if(this.x + this.width > next.x && line.y == next.y)
				{
					return;
				}
				valid = that.check
				(
					this.x + this.width, line.y, next.width, next.height
				);
				if(valid)
				{
					next.x = this.x + this.width;
					next.y = line.y;
				}
			});
		});
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
			return this.each(function(j, box)
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
	Laid.prototype.append = function(box)
	{
		var indices = [], that = this;

		this.stack.push(box);

		indices.push(this.line(box.y));
		indices.push(this.line(box.y + box.height));

		for(var i = 0, j, line; i < indices.length; i++)
		{
			if(indices[i] == -1)
			{
				continue;
			}
			line = this.lines[indices[i]];

			for(j = 0; j < this.stack.length; j++)
			{
				if(this.inline(that.stack[j], indices[i]))
				{
					line.box(that.stack[j]);
				}
			}
		}
		this.each(function(i, line)
		{
			if(that.inline(box, i))
			{
				this.box(box);
			}
		});
	};
	Laid.prototype.inline = function(box, i)
	{
		var line = this.lines[i];

		if(line.y >= box.y + box.height)
		{
			return false;
		}
		if(line.y < box.y)
		{
			if(line.width >= box.x + box.width)
			{
				return false;
			}
			while(this.lines[i++].y < box.y)
			{
				if(this.lines[i].width > box.x + box.width)
				{
					return false;
				}
			}
		}
		return true;
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
		return index;
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
			,
			true);

			this.each(function(j, box)
			{
				that.log
				(
					'> #' + (j + 1) + ' [' +
					this.x + ' ' +
					this.y + ' ' +
					this.width + ' ' +
					this.height + ']'
				,
				true);
			});
		});
		that.log('built in ' + time + 'ms', true);
	};
	Laid.prototype.log = function(message, bypass)
	{
		if(this.option('debug') || bypass)
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
	Line.prototype.box = function(box)
	{
		var index = 0;

		this.each(function(j)
		{
			if(this == box)
			{
				index = -1;

				return false;
			}
			if(this.x <= box.x)
			{
				index = j + 1;
			}
			return true;
		});
		if(index != -1)
		{
			if(box.x + box.width > this.width)
			{
				this.width = box.x + box.width;
			}
			this.splice(index, 0, box);
		}
	};

	/* Block constructor */

	var Block = function(child, laid)
	{
		if(!(this.child = child))
		{
			return;
		}
		this.laid = laid;

		this.init();
	};

	/* Block prototype */

	Block.prototype.init = function()
	{
		var c = $(this.child), position = c.position();

		this.x = position.left;
		this.y = position.top;

		this.width = c.outerWidth();
		this.height = c.outerHeight();

		this.h = this.width - c.width();
		this.v = this.height - c.height();

		this.original =
		{
			width: this.width,
			height: this.height
		};
		this.next =
		{
			width: this.width,
			height: this.height
		};
	};
	Block.prototype.option = function(name)
	{
		return this.laid.option(name, this.child);
	};
	Block.prototype.update = function(box)
	{
		Laid.args(this, box, true);
	};
	Block.prototype.diff = function(box)
	{
		var diff = {};

		diff.x = box.x - this.x;
		diff.y = box.y - this.y;

		diff.width = box.width - this.width;
		diff.height = box.height - this.height;

		if(!diff.x
		&& !diff.y
		&& !diff.width
		&& !diff.height)
		{
			return false;
		}
		return diff;
	};
	Block.prototype.preset = function()
	{
		if(this.insert)
		{
			this.insert = false;

			this.x = this.next.x;
			this.y = this.next.y;

			this.width = this.h;
			this.height = this.v;
		}
	};
	Block.prototype.set = function(init)
	{
		this.preset();

		var diff = this.diff(this.next), that = this;

		if(!diff && !init)
		{
			return;
		}
		this.update(this.next);

		var transition = this.option('transition');

		if(!transition || init)
		{
			this.assign
			(
				this.x,
				this.y,
				this.width - this.h,
				this.height - this.v
			);
			return;
		}
		var duration = this.option('duration');

		new Animation(this, duration, transition, function(ratio)
		{
			ratio = 1 - ratio;

			that.assign
			(
				that.x - (diff.x * ratio),
				that.y - (diff.y * ratio),
				that.width - (diff.width * ratio) - that.h,
				that.height - (diff.height * ratio) - that.v
			);
		});
	};
	Block.prototype.assign = function(x, y, width, height)
	{
		$(this.child).css(
		{
			left: x, top: y, width: width, height: height
		});
	};

	/* Animation constructor */

	var Animation = function(id, duration, transition, callback)
	{
		this.id = id;

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
		for(var i = 0; i < this.stack.length; i++)
		{
			if(this.stack[i].id === animation.id)
			{
				this.stack.splice(i, 1);

				break;
			}
		}
		this.stack.push(animation);

		animation.frame(time());
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

	$.fn.laid = function(method, args)
	{
		if(typeof(method) != 'string')
		{
			args = method;
		}
		args = args || {};

		this.each(function()
		{
			if(!$.data(this, 'laid'))
			{
				return new Laid(this, $.extend({}, args));
			}
			if(method)
			{
				return $.data(this, 'laid')[method](args, this);
			}
			return false;
		});
		return this;
	};
})
(jQuery, window, document);