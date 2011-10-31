[1mdiff --git a/jquery.jlaid.js b/jquery.jlaid.js[m
[1mindex b8dc105..9e708ba 100644[m
[1m--- a/jquery.jlaid.js[m
[1m+++ b/jquery.jlaid.js[m
[36m@@ -136,7 +136,7 @@[m [mlayout.max = function(matrix)[m
 	};[m
 	Laid.prototype.resize = function()[m
 	{[m
[31m-		this.lines = { 0: { 0: true } };[m
[32m+[m		[32mthis.lines = { 0: { 0: 0 } };[m
 		this.stack = [];[m
 [m
 		this.width = $(this.wrapper).width();[m
[36m@@ -158,27 +158,27 @@[m [mlayout.max = function(matrix)[m
 	};[m
 	Laid.prototype.next = function(width, height)[m
 	{[m
[31m-		var pos = [Laid.INFINITE, Laid.INFINITE];[m
[32m+[m		[32mvar pos = [Laid.INFINITE, Laid.INFINITE], x, y;[m
 [m
 		for(var i in this.lines)[m
 		{[m
[31m-			i = Number(i);[m
[32m+[m			[32my = Number(i);[m
 [m
[31m-			if(i > pos[1])[m
[32m+[m			[32mif(y > pos[1])[m
 			{[m
 				continue;[m
 			}[m
 			for(var j in this.lines[i])[m
 			{[m
[31m-				j = Number(j);[m
[32m+[m				[32mx = Number(j) + this.lines[i][j];[m
 [m
[31m-				if(j > pos[0] && i == pos[1])[m
[32m+[m				[32mif(x > pos[0] && y == pos[1])[m
 				{[m
 					continue;[m
 				}[m
[31m-				if(this.check(j, i, width, height))[m
[32m+[m				[32mif(this.check(x, y, width, height))[m
 				{[m
[31m-					pos = [j, i];[m
[32m+[m					[32mpos = [x, y];[m
 				}[m
 			}[m
 		}[m
[36m@@ -190,6 +190,15 @@[m [mlayout.max = function(matrix)[m
 		{[m
 			return false;[m
 		}[m
[32m+[m		[32mfor(var i in this.lines[y])[m
[32m+[m		[32m{[m
[32m+[m			[32mif(Number(i) == x)[m
[32m+[m			[32m{[m
[32m+[m				[32mconsole.log(this.stack.length);[m
[32m+[m				[32mconsole.log(i + ' ' + x);[m
[32m+[m				[32mreturn false;[m
[32m+[m			[32m}[m
[32m+[m		[32m}[m
 		for(var i in this.stack)[m
 		{[m
 			if(this.stack[i].x + this.stack[i].width <= x)[m
[36m@@ -216,7 +225,7 @@[m [mlayout.max = function(matrix)[m
 	{[m
 		if(!this.lines[y + height])[m
 		{[m
[31m-			this.lines[y + height] = { 0: true };[m
[32m+[m			[32mthis.lines[y + height] = { 0: 0 };[m
 		}[m
 		this.stack.push({ x: x, y: y, width: width, height: height });[m
 [m
[36m@@ -228,10 +237,10 @@[m [mlayout.max = function(matrix)[m
 [m
 			for(var j in this.lines)[m
 			{[m
[31m-				//if(j >= item.y && j < item.y + item.height)[m
[31m-				if(1) // test[m
[32m+[m				[32mif(j < item.y + item.height)[m
[32m+[m				[32m//if(1) // test[m
 				{[m
[31m-					this.lines[j][item.x + item.width] = true;[m
[32m+[m					[32mthis.lines[j][item.x] = item.width;[m
 				}[m
 			}[m
 		}[m
[1mdiff --git a/test.html b/test.html[m
[1mindex 4564b68..4ddcfb1 100644[m
[1m--- a/test.html[m
[1m+++ b/test.html[m
[36m@@ -40,16 +40,26 @@[m [m$(function()[m
 {[m
 	$('.grid li').each(function()[m
 	{[m
[31m-		$(this).width(Math.round(Math.random() * 2) * 200 + 200);[m
[32m+[m		[32m$(this).width(Math.round(Math.random() * 1) * 200 + 180);[m
 	});[m
[32m+[m	[32mvar t = (new Date().getTime());[m
 	$('.grid').laid();[m
[32m+[m	[32mconsole.log((new Date().getTime()) - t);[m
 });[m
 	</script>[m
 </head>[m
 <body>[m
 	<ul class="grid">[m
 		<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
[31m-		<li style="width: 600px;"><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
[32m+[m		[32m<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
 		<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p></li>[m
 		<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
 		<li><p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></li>[m
