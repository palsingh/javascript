YUI.add("image-slider", function(Y) {
	
	function ImageSlider(config) {
		ImageSlider.superclass.constructor.apply(this, arguments);
	}
	ImageSlider.NAME = 'ImageSlider';
	ImageSlider.NS = 'iS';
	
	ImageSlider.ATTRS = {
		'host' : {
			'value' : null			// image container
		},
		'duration' : {
			'value' : 1				// animation time
		},
		'easing' : {
			'value' : 'backOut'
		},
		'slideTime' : {
			'value' : 3000			// slide image after this time
		},
		'leftButton' : {
			'value' : null			// Left button node
		},
		'rightButton' : {
			'value' : null			// right button node
		},
		'direction' : {
			'value' : 'right'		// value can be right or left only
		}
	}
	
	//ImageSlider.DEFAULT_DURATION = 0.8
	//ImageSlider.DEFAULT_EASING = Y.Easing.backIn;
	
	Y.extend(ImageSlider, Y.Plugin.Base, {
		
		'initializer' : function(config) {
			this.set('host' , config.host);
			this._setupImages();
		},
		'destructor' : function() {
			
		},
		'_setupImages' : function(){
			var containerNode = this.get('host');
			var numberOfImages = this._numberOfImages();
			var positionLeft = 0;
			for(var i = 0; i < numberOfImages; i++){
				if(i < 3){
					positionLeft = containerNode.getStyle('width');
					positionLeft = parseInt(positionLeft.substr(0, positionLeft.length-2));
					positionLeft = i*positionLeft;
					containerNode.get('children').item(i).setStyles({
						'position' : 'absolute',
						'top' : '0px',
						'left' : positionLeft
					});
				}else {
					containerNode.get('children').item(i).setStyles({
						'position' : 'absolute',
						'top' : '0px',
						'left' : parseInt(containerNode.getStyle('width').substr(0, containerNode.getStyle('width').length-2))
					});
				}
				containerNode.get('children').item(i).setStyle('display','block');
			}
			this._executeAnim();
		},
		'_numberOfImages' : function(){
			var containerNode = this.get('host');
			return containerNode.get('children').filter('img').size();
		},
		'_animateBothSide' : function(node,leftStart,leftEnd){
			var containerNode = this.get('host');
			var sliderAnim = new Y.Anim({
				'node' : node,
				'duration' : this.get('duration'),
				'easing' : this.get('easing'),
				'from' : {
					'left' : leftStart
				},
				'to' : {
					'left' : leftEnd
				},
				'on' : {
					'start' : function(){
						
					},
					'end' : function(){
						
					}
				}
			});
			sliderAnim.run();
		},
		'_executeAnim' : function(){
			var slideTime = this.get('slideTime')/2,
				numberOfImages = this._numberOfImages(),
				containerNode = this.get('host'),
				currentImage = 0,
				that = this,
				leftButton = Y.one(this.get('leftButton')),
				rightButton = Y.one(this.get('rightButton')),
				slideDirection = this.get('direction'),
				slidingStatus = 0;
			var rightButtonSlide = function(){
				//rightButton.on('click',function(e){
					if(currentImage == numberOfImages){
						currentImage = 0;
						that._setupAnim(currentImage,'left');
						currentImage++;
					}else{
						that._setupAnim(currentImage,'left');
						currentImage++;
					}
					slidingStatus = 0;
				//});
			}
			//rightButtonSlide();
			
			var leftButtonSlide = function(){
				//leftButton.on('click',function(e){
					if(currentImage == -1 || currentImage == numberOfImages){
						currentImage = numberOfImages-1;
						that._setupAnim(currentImage,'right');
						currentImage--;
					}else{
						that._setupAnim(currentImage,'right');
						currentImage--;
					}
					slidingStatus = 0;
				//});
			}
			//leftButtonSlide();
			
			setInterval(function(){
				if(slidingStatus == 1){ // reset slide time if clicked on left/right button by user
					if(slideDirection == 'left'){
						leftButtonSlide();
					}else if(slideDirection == 'right'){
						rightButtonSlide();
					}
				}else{
					slidingStatus = 1;
				}
			},slideTime);
			/*
			// Remove Click event on mouseover and bind it again on mouseout
			containerNode.get('children').filter('img').on('hover',function(){
				leftButton.detach('click');
				rightButton.detach('click');
			}, function(){
				leftButton.on('click',leftButtonSlide);
				rightButton.on('click',rightButtonSlide);
			});
			
			leftButton.on('mouseover',function(){
				leftButton.detach('click');
				rightButton.detach('click');
				leftButton.on('click',leftButtonSlide);
				rightButton.on('click',rightButtonSlide);
			});
			*/
		},
		'_setupAnim' : function(startImage,direction){
			var containerNode = this.get('host'),
				numberOfImages = this._numberOfImages(),
				imageNode = '',
				limitImages = 0,
				leftStart = 0,
				that = this,
				leftEnd = 0;
			if(direction == 'right'){
				
				// Reset the value to last image if the current image is the first image
				if(startImage == -1){
					startImage = numberOfImages-1;
				}
				
				// Run anim for the current visible image
				imageNode = containerNode.get('children').item(startImage);
				leftEnd = containerNode.getStyle('width');
				that._animateBothSide(imageNode,leftStart,leftEnd);
				startImage--;
				
				// Reset the value to last image if the current image is the first image
				if(startImage == -1){
					startImage = numberOfImages-1;
				}

				// Run anim for the second image
				imageNode = containerNode.get('children').item(startImage);
				leftStart = '-'+containerNode.getStyle('width');
				leftEnd = 0;
				that._animateBothSide(imageNode,leftStart,leftEnd);
				startImage--;
				
				// Reset the value to last image if the current image is the first image
				if(startImage == -1){
					startImage = numberOfImages-1;
				}
				
				// Run anim for the third image
				imageNode = containerNode.get('children').item(startImage);
				leftStart = '-'+parseInt(containerNode.getStyle('width').substr(0, containerNode.getStyle('width').length-2))*2;
				leftEnd = '-'+containerNode.getStyle('width');
				that._animateBothSide(imageNode,leftStart,leftEnd);
				
			}else {
				if(startImage == -1){
					startImage = numberOfImages-1;
				}
				// Run anim for the current visible image
				imageNode = containerNode.get('children').item(startImage);
				leftEnd = '-'+containerNode.getStyle('width');
				that._animateBothSide(imageNode,leftStart,leftEnd);
				startImage++;
				
				// Reset the value to first image if the current image is the last one
				if(startImage == numberOfImages){
					startImage = 0;
				}
				
				// Run anim for the second image
				imageNode = containerNode.get('children').item(startImage);
				leftStart = containerNode.getStyle('width');
				leftEnd = 0;
				that._animateBothSide(imageNode,leftStart,leftEnd);
				startImage++;
				
				// Reset the value to first image if the current image is the last one
				if(startImage == numberOfImages){
					startImage = 0;
				}
				
				// Run anim for the third image
				imageNode = containerNode.get('children').item(startImage);
				leftStart = parseInt(containerNode.getStyle('width').substr(0, containerNode.getStyle('width').length-2))*2;
				leftEnd = containerNode.getStyle('width');
				that._animateBothSide(imageNode,leftStart,leftEnd);
			}
		}
		
	});
	Y.namespace('Plugin').ImageSlider = ImageSlider;
}, "3.1.0", {requires:["plugin","anim","event-hover"]});
