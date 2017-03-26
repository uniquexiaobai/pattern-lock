(function (global) {
	global.Lock = function () {

	}

	var LockProto = Lock.prototype;

	LockProto.init = function () {
		this.canvas = document.getElementById('lock');
		this.context = this.canvas.getContext('2d');
		this.radius = this.canvas.width / 14;
		this.activeIndexList = [];
		this.touching = false;

		this.initPoints();
		this.bindEvent();
	}

	LockProto.initPoints = function () {
		var radius = this.radius;
		this.list = [];

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				var point = {
					x: this.radius * 3 + this.radius * 4 * j,
					y: this.radius * 3 + this.radius * 4 * i,
					index: i * 3 + j + 1
				};

				this.list.push(point);
			}
		}
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (var i = 0, list = this.list; i < list.length; i++) {
			drawPoint(this.context, list[i].x, list[i].y, this.radius, '#fff', '#bcbcbc');
		}
	}

	LockProto.bindEvent = function () {
		var canvas = this.canvas;
		var self = this;

		canvas.addEventListener('touchstart', function (e) {
			var list = self.list;
			var eventPosition = getEventPosition(e);

			for (var i = 0; i < list.length; i++) {
				if (isCircleTouched(eventPosition, list[i], self.radius)) {
					// draw active point
					drawPoint(self.context, list[i].x, list[i].y, self.radius, '#FFA726', '#E36265');
					self.touching = true;
					self.activeIndexList.push(list[i].index);
				}
			}
		});

		canvas.addEventListener('touchmove', function (e) {
			if (self.touching) {
				self.updatePoints(getEventPosition(e));
			}
		});

		canvas.addEventListener('touchend', function (e) {
			if (self.touching) {
				self.touching = false;
				// savePasswd()
				console.log(self.activeIndexList);
			}
		});
	}

	LockProto.updatePoints = function (eventPosition) {
		var list = this.list;
		var activeIndexList = this.activeIndexList;

		for (var i = 0; i < list.length; i++) {

			if (isCircleTouched(eventPosition, list[i], this.radius) && !hasActiveIndexExisted(activeIndexList, list[i].index)) {
				// draw active point
				drawPoint(this.context, list[i].x, list[i].y, this.radius, '#FFA726', '#E36265');
				activeIndexList.push(list[i].index);
			}
		}
	}

	function drawPoint(ctx, x, y, r, fillStyle, strokeStyle) {
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.arc(x, y, r - 1, 0, Math.PI * 2);
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	function getEventPosition(e) {
		var clientReact = e.currentTarget.getBoundingClientRect();
		var eventPosition = {
			x: e.touches[0].clientX - clientReact.left,
			y: e.touches[0].clientY - clientReact.top
		};

		return eventPosition;
	}

	function isCircleTouched(eventPosition, circlePosition, radius) {
		if (Math.abs(eventPosition.x - circlePosition.x) <= radius && Math.abs(eventPosition.y - circlePosition.y) <= radius) {
			return true;
		}
		return false;
	}

	function hasActiveIndexExisted(activeIndexList, index) {
		return ~activeIndexList.indexOf(index);
	}
	
}(this));