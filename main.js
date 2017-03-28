(function (global) {
	var lockInfoElement = document.getElementById('lockInfo');
	var setPasswdRadioElement = document.getElementById('setPasswd');
	var checkPasswdRadioElement = document.getElementById('checkPasswd');
	var LOCAL_STORAGE_KEY = 'uniquePasswd';

	global.Lock = function (options) {
		this.canvas = document.getElementById('lock');
		this.radius = this.canvas.width / 14;
		this.context = this.canvas.getContext('2d');
		this.nodeList = [];
		this.activeNodeList = [];
		this.passwdList = [];
		this.touching = false;

		console.log(options);

		this.initNodes();
		this.bindEvent();
		this.initStatus();
	}

	var LockProto = Lock.prototype;

	LockProto.bindEvent = function () {
		var canvas = this.canvas;
		var self = this;

		canvas.addEventListener('touchstart', function (e) {
			var radius = self.radius;
			var nodeList = self.nodeList;
			var touchPosition = getTouchPosition(e);

			for (var i = 0; i < nodeList.length; i++) {
				if (isNodeTouched(touchPosition, nodeList[i], radius)) {
					drawNode(self.context, nodeList[i].x, nodeList[i].y, radius, '#FFA726', '#E36265');
					self.activeNodeList.push(nodeList[i]);
					self.touching = true;
				}
			}
		});

		canvas.addEventListener('touchmove', function (e) {
			if (self.touching) {
				self.update(getTouchPosition(e));
			}
		});

		canvas.addEventListener('touchend', function (e) {
			if (!self.touching) return;
			self.touching = false;
			var activeNodeList = self.activeNodeList; 
			var passwdList = self.passwdList;

			switch (passwdList.length) {
				case 0: {
					if (activeNodeList.length < 5) {
						setLockInfo('密码太短，至少需要 5 个点');
					} else {
						passwdList.push(activeNodeList);
						setLockInfo('请再次输入手势密码');
					}
					break;
				}
				case 1: {
					if (checkIsPasswdSame(passwdList[0], activeNodeList)) {
						savePasswdToStorage(LOCAL_STORAGE_KEY, activeNodeList);
						self.switchStatusToCheck(activeNodeList);
						setLockInfo('密码设置成功');
					} else {
						self.switchStatusToSet();
						setLockInfo('两次输入的不一致，重新设置')
					}
					break;
				}
				case 2: {
					var passwd = getPasswdFromStorage(LOCAL_STORAGE_KEY);

					if (!passwd) {
						self.switchStatusToSet();
						setLockInfo('储存的密码破损，请重新设置');
						break;
					}
					if (checkIsPasswdSame(passwd, activeNodeList)) {
						setLockInfo('密码正确');
					} else {
						setLockInfo('输入的密码不正确');
					}
					break;
				}
				default: {
					setPasswdRadioElement.click();
				}
			}

			/* debug start */
			console.log(activeNodeList.map(function (v) {
				return v.index;
			}));
			/* debug end */

			self.resetNodes();
		});

		// remove broser default touch event
		document.body.addEventListener('touchmove', function (e) {
			e.preventDefault();
		});

		setPasswdRadioElement.addEventListener('click', function (e) {
			self.switchStatusToSet();
			setLockInfo('请输入手势密码');
		});

		checkPasswdRadioElement.addEventListener('click', function (e) {
			var passwd = getPasswdFromStorage(LOCAL_STORAGE_KEY);

			if (passwd) {
				self.switchStatusToCheck(passwd);
				setLockInfo('请输入手势密码解锁');
			} else {
				self.switchStatusToSet();
				setLockInfo('密码不存在，请先设置');
			}
		});
	}

	LockProto.initNodes = function () {
		this.nodeList = [];
		var canvas = this.canvas;
		var radius = this.radius;
		var ctx = this.context;
		var nodeList = this.nodeList;

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 3; j++) {
				var node = {
					x: radius * 3 + radius * 4 * j,
					y: radius * 3 + radius * 4 * i,
					index: i * 3 + j + 1
				};

				nodeList.push(node);
			}
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (i = 0; i < nodeList.length; i++) {
			drawNode(ctx, nodeList[i].x, nodeList[i].y, radius, '#fff', '#bcbcbc');
		}
	}

	LockProto.resetNodes = function () {
		this.activeNodeList = [];
		this.initNodes();
	}

	LockProto.update = function (touchPosition) {
		var ctx = this.context;
		var nodeList = this.nodeList;
		var activeNodeList = this.activeNodeList;

		this.initNodes();
		for (var i = 0; i < nodeList.length; i++) {
			if (isNodeTouched(touchPosition, nodeList[i], this.radius) && !isNodeActived(activeNodeList, nodeList[i])) {
				activeNodeList.push(nodeList[i]);
			}
		}

		for (i = 0; i < activeNodeList.length; i++) {
			drawNode(ctx, activeNodeList[i].x, activeNodeList[i].y, this.radius, '#FFA726', '#E36265');
		}
		drawLines(ctx, activeNodeList.concat(touchPosition), 'red');
	}

	LockProto.initStatus = function () {
		checkPasswdRadioElement.click();
	}

	LockProto.switchStatusToSet = function () {
		this.passwdList.length = 0;
		setRadioChecked(setPasswdRadioElement);
	}

	LockProto.switchStatusToCheck = function (passwd) {
		this.passwdList = [passwd, passwd];
		setRadioChecked(checkPasswdRadioElement);
	}

	function drawLines(ctx, points, strokeStyle) {
		ctx.lineWidth = 2;
		ctx.strokeStyle = strokeStyle;
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		for (var i = 0; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y);
		}
		ctx.stroke();
		ctx.closePath();
	}

	function drawNode(ctx, x, y, r, fillStyle, strokeStyle) {
		ctx.fillStyle = fillStyle;
		ctx.strokeStyle = strokeStyle;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(x, y, r - 2, 0, Math.PI * 2);
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	function getTouchPosition(e) {
		var clientReact = e.currentTarget.getBoundingClientRect();
		var touchPosition = {
			x: e.touches[0].clientX - clientReact.left,
			y: e.touches[0].clientY - clientReact.top
		};

		return touchPosition;
	}

	function isNodeTouched(touchPosition, nodePosition, nodeRadius) {
		if (Math.abs(touchPosition.x - nodePosition.x) <= nodeRadius && Math.abs(touchPosition.y - nodePosition.y) <= nodeRadius) {
			return true;
		}
		return false;
	}

	function isNodeActived(activeNodeList, currentNode) {
		return activeNodeList.some(function (node) {
			return node.index === currentNode.index;
		});
	}

	function checkIsPasswdSame(passwd1, passwd2) {
		if (passwd1.length !== passwd2.length) return false;
		for (var i = 0; i < passwd1.length; i++) {
			if (passwd1[i].index !== passwd2[i].index) {
				return false;
			}
		}
		return true;
	}

	function savePasswdToStorage(storageKey, passwd) {
		global.localStorage.setItem(storageKey, JSON.stringify(passwd));
	}

	function getPasswdFromStorage(storageKey) {
		var passwd, serializedPasswd = global.localStorage.getItem(storageKey);

		try {
			passwd = JSON.parse(serializedPasswd);
		} catch(e) {
			console.error(e);
			return false;
		}
		return passwd;
	}

	function setLockInfo(info) {
		lockInfoElement.innerHTML = info;
	}

	function setRadioChecked(radioElement) {
		radioElement.checked = true;
	}
	
}(this));

new Lock();
