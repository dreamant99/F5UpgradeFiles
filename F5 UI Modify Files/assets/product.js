/* js for product page */
(function($, exports) {
    "use strict";

    var original_standard_price;
    var original_price;
    var original_inventory;
    var original_quantity_max;
    var code_value = {};
    var code_values = {};  //it is used to maintain the useful options show in UI
    var original_code_values = {};
    var selectedvariant = "";

    var variants;
    var siteurl;
    var productListImageLen;
    var allProductImages;
    var prductImagesGalleryEle;

    var initSortPanel = function(e){
        $(e).on("click", "input[type=radio]", function(){
            $(this).parents("form").submit();
        });
    };
    var showAddToCartPopup = function() {
        var options = {
            backdrop: false,
            show: true
        };
        $('.add-to-cart-popup').modal(options);
    };

    var hideAddToCartPopup = function() {
        $('.add-to-cart-popup').modal('hide');
    };

    window.procProductDetailFrontend = function() {
        $('.frame').find('img').load(function() {
            imageAdjust();
        }).each(function() {
            if(this.complete) {
                $(this).load();
            }
        });
        $( window ).load(function() {
            imageAdjust();
        });
        initialEasyroom();
        $('.pd-tumbnailimage-style' + ' a').on('click', function(e) {
            if (window.isPhone()) {
                e.preventDefault();
                return ;
            }
            changeThumbnailImageStyle(e);
        });

        $('.promotions').on("click", ".promotion-show-more", function(e) {
            showMorePromotions(e);
        });

        $('#productDescriptionTab a').click(function(e) {
            e.preventDefault();// interrupt the redirect of link
            $(this).tab('show');
        });

        $('.pd_variants').change(function(){
            variantChange(this);
        });
        $(".pd_quantity_number").change(function(){
            quantityChange(this.value);
        });

        $('#pd_addtocart_var').on('click', function(e) {
            add2cart(e);
        });

        $('#pd_buynow_var').on('click', function(e) {
            buynow(e);
        });

        $('#review-rating').on('click', function(){
            $('#product-review-rating').modal('show');
        });

        if (product) {
            getPromotions();

            variants = product && product["_skus"];
            siteurl = $('#siteurl').val();
            productListImageLen = parseInt($('input[name=productImageListLen]').val());
            allProductImages = (function(){
                var allImages = [];
                $('input[name=proudctImageList]').each(function(){
                    var url = $(this).val();
                    allImages.push(url);
                });
                return allImages;
            }());
            prductImagesGalleryEle = $.extend(true, {}, $('.pd-thumnail-image-gallery').clone(true, true));

            //save original values
            original_standard_price = $("#pd_standardPrice_var")[0].innerHTML;
            original_price = $("#pd_price_var")[0].innerHTML;
            original_inventory = $("#pd_inventory_var")[0].innerHTML;
            original_quantity_max = $("#pd_quanity_var")[0].max;

            //init code value
            codeValueInit();
            updateAddToCart();
            refreshCodeValues();
            activeImageSlick();
        }

    };

    var getATSForProduct = function () {
        var skuids = [];
        var skus = product['_skus'];
        for (var index in skus){
            skuids.push(skus[index]['skuId']);
        }

        jsapi.getATS(skuids)
            .done(function (data) {
                product['stockQuantity'] = data['total'];
                product['allowBackOrder'] = data['allowBackOrder'];
                for (var index in product['_skus']) {
                    for(var index_data in data['skus']){
                        if(data['skus'][index_data]['skuid'] && data['skus'][index_data]['skuid'] == product['_skus'][index]['skuId'] && data['skus'][index_data]['store_quantity']){
                            product['_skus'][index]['stockQuantity'] = data['skus'][index_data]['store_quantity'];
                        }
                    }

                }
                $("#pd_inventory_var")[0].innerHTML = product['stockQuantity'];
                original_quantity_max = product['stockQuantity'];
                original_inventory = product['stockQuantity'];
                setStockStatus(parseInt(product['stockQuantity']));
            }).fail(function () {

        });
    };

    getATSForProduct();

    $(window).on("resize", function() {
        setTimeout(function() {
            imageAdjust();
        }, 100);     // set the timeout because there is size change in slick.js(50ms), so we execute our function after the function in slick.js
    });

    $(window).bind("orientationchange", function() {
        setTimeout(function() {
            $(window).trigger('resize');
        }, 100);   // set the timeout because there is size change in slick.js(50ms), so we execute our function after the function in slick.js
    });

    var showMorePromotions = function(e) {
        var otherItems = $('.promotion-item:not(:first-child)');
        var display = otherItems.css('display');
        if (display === 'none') {
            otherItems.css('display', 'block');
        } else {
            otherItems.css('display', 'none');
        }
        var icon = $('.promotion-show-more').find('.icon');
        icon.toggleClass('icon-downwardarrow icon-upwardarrow');
    };

    function imageAdjust() {
        if ($('.real-product-content').length === 0) {
            return;
        }
        var maxW, maxH;
        if (window.isPhone()) {
            maxW = parseInt($('.pd-thumnail-image-gallery').width());
            maxH = parseInt($('.pd-thumnail-image-gallery').height());
            imageResizeByDiv(maxW, maxH, $('.frame'));
        } else {
            //for feature image
            maxW = parseInt($('.pd-boot-image-class').width());
            maxH = parseInt($('.pd-boot-image-class').height());
            imageResizeByDiv(maxW, maxH, $('.pd-boot-image-class'));
//            //for thumail image
            maxW = parseInt($('.pd-tumbnailimage-style').width());
            maxH = parseInt($('.pd-tumbnailimage-style').height());
            imageResizeByDiv(maxW, maxH, $('.pd-tumbnailimage-style'));
        }
    }

    function imageResizeByDiv(maxWidth, maxHeight, container) {
        var lineHeight = false;

        $(container).each(function(){
            $(this).find('img').each(function(){
                lineHeight = singleimageAdjust($(this), maxWidth, maxHeight);
            });

            if (lineHeight) {
                $(this).css('line-height', maxHeight+'px');
            } else {
                $(this).css('line-height', 'normal');
            }
        });
    }

    function singleimageAdjust(image, maxWidth, maxHeight) {
        var ratio = 0;  // Used for aspect ratio

        // Create new offscreen image to test
        var theImage = new Image();
        theImage.src = image.attr("src");

        // Get accurate measurements from that.
        var width = theImage.width;
        var height = theImage.height;

        // Check if the current width is larger than the max
        if(width > maxWidth){
            ratio = maxWidth / width;   // get ratio for scaling image
            $(image).css("width", maxWidth); // Set new width
            $(image).css("height", height * ratio);  // Scale height based on ratio
            height = height * ratio;    // Reset height to match scaled image
            width = width * ratio;    // Reset width to match scaled image
        }

        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image
            $(image).css("height", maxHeight);   // Set new height
            $(image).css("width", width * ratio);    // Scale width based on ratio
            width = width * ratio;    // Reset width to match scaled image
        }

        if (height < maxHeight) {
            return true;
        } else {
            return false;
        }
    }

    function initialEasyroom() {
        if (window.isPhone()) {
            return ;
        }
        // Instantiate EasyZoom instances
        var $easyzoom = $('.easyzoom').easyZoom();
        // Get an instance API
        var api = $easyzoom.filter('.easyzoom--with-thumbnails').data('easyZoom');
        // Setup thumbnails example
        $("#pd-image-gallery").on("click", "a", function(e) {
            var $this = $(this);
            e.preventDefault();
            // Use EasyZoom's `swap` method
            api.swap($this.data("standard"), $this.attr("href"));
        });
    }

    function activeImageSlick() {
        if (window.isPhone()) {
            if (productListImageLen > 1) {
                $('.pd-thumnail-image-gallery').slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    unslicked: true,
                    focusOnSelect: true,
                    dots: false,
                    infinite: false,
                    arrows: false,
                    onAfterChange: procSlickChangeonPhone
                });
            }
        } else {
            if (productListImageLen > 0) {
                $('.pd-thumnail-image-gallery').slick({
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    dots: false,
                    unslicked: true,
                    focusOnSelect: true,
                    infinite: false,
                    arrows: true,
                    onAfterChange: imageAdjust,
                    prevArrow: '<i class="icon icon-leftwardarrow slick-prev-icon icon-2x"></i>',
                    nextArrow: '<i class="icon icon-rightwardarrow slick-next-icon icon-2x"></i>',
                    responsive: [
                        {
                            breakpoint: 600,
                            settings: {
                                slidesToShow: 2,
                                slidesToScroll: 2,
                                arrows: true
                            }
                        },
                        {
                            breakpoint: 480,
                            settings: {
                                arrows: true,
                                slidesToShow: 1,
                                slidesToScroll: 1
                            }
                        }
                    ]
                });

            }
        }
        $('.product-view').slick({
            slidesToShow: 4,
            slidesToScroll: 4,
            dots: false,
            infinite: true,
            arrows: true,
            prevArrow: '<i class="icon icon-leftwardarrow slick-prev-icon icon-2x"></i>',
            nextArrow: '<i class="icon icon-rightwardarrow slick-next-icon icon-2x"></i>',
            responsive: [
                {
                    breakpoint: 992,
                    settings: {
                        arrows: true,
                        slidesToShow: 3,
                        slidesToScroll: 3
                    }
                },
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        arrows: true
                    }
                }
            ]
        });
    }

    function procSlickChangeonPhone(slick, currentSlide){
        var total = $('.pd-thumnail-image-gallery').find('.slick-slide').length;
        var t = (currentSlide% parseInt(total)) + 1;
        //reback
        if (t === 1) {
            $('.pd-thumnail-image-gallery').slick('slickPrev');
        }
        var tx = t + " / " + total;
        $('#slick-slide-index').text(tx);
    }

    function hasProductImage() {
        if (product !== null && product !== undefined
            && product['featuredImage'] !== undefined && product['featuredImage'] !== null
            && product['featuredImage'] !== ' ' && product['featuredImage'] !== '') {
            return true;
        }
        return false;
    }

    function isHasImageOption(optioncode) {
        var variants = product['variants'];
        for (var index in variants[optioncode]['validValues']) {
            var value = variants[optioncode]['validValues'][index];
            var images = value['images'];
            if (images !== undefined && images !== null) {
                for (var i in images) {
                    if (images[i] !== undefined && images[i] !== null && images[i] !== '' && images[i] !== ' ') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function hasOptionImage(optioncode, optionvaluecode) {
        var variants = product['variants'];
        for (var index in variants[optioncode]['validValues']) {
            var value = variants[optioncode]['validValues'][index];
            if (String(value['id']) == String(optionvaluecode)) {
                var images = value['images'];
                if (images !== undefined && images !== null) {
                    for (var i in images) {
                        if (images[i] !== undefined && images[i] !== null && images[i] !== '' && images[i] !== ' ') {
                            return images;
                        }
                    }
                }
            }
        }
        return false;
    }

    function activeThumbnailImageChange() {
        $('.pd-tumbnailimage-style' + ' a').click( function(e) {
            var changedImage = $(this).data('image');
            var gallery = $(e.target).parents('.pd-thumnail-image-gallery');
            if($.inArray("pd-option-gallery", gallery[0].classList) < 0) {
                $('#pd_boothimage')[0].src = changedImage;
            } else {
                var option_code = gallery.data('option-code');
                $('#pd_option_boothimage-' + option_code)[0].src = changedImage;
            }
        });
    }

    function changeThumbnailImageStyle(e) {
        $('.pd-tumbnailimage-style').removeClass('pd-thumbnail-image-selected');
        $(e.target).parents('.pd-tumbnailimage-style').addClass('pd-thumbnail-image-selected');
    }

    function updateAddToCart(){
        //disable or enable add to cart
        if(validVariant() && validInventory()){
            enableAddToCart();
        }else{
            disableAddToCart();
        }
    }

    function quantityChange(value){
//        var num = Number($("#pd_quanity_var")[0].value);
        var num = Number(value);
        $(".pd_quantity_number").each(function() {
            this.value = num;
        });
        if(num === 0){
//            that.value = 1;
            $(".pd_quantity_number").each(function() {
                this.value = 1;
            });
        }

    }

    function variantChange(that){
        hideWarning();
        updateCodeValue(that);
        variantChangeAction(that);
        refreshCodeValues();
        var unSelectedVariants = getUnselectedVariant();
        if(device.isDesktop&&unSelectedVariants.length>0){
            warningSelectVariant(unSelectedVariants.join('/'))
        }
    }

    function resetSlick(length, startIndex, totalLen){
        if (length !== undefined) {
            if (window.isPhone()) {
                $('.pd-thumnail-image-gallery').slickGoTo(startIndex);
                return ;
            }

            var currentSlideNum = $('.pd-thumnail-image-gallery').slickGetOption('slidesToShow');
            var totalSlides = ((totalLen - currentSlideNum) < 0 ? 1:(totalLen - currentSlideNum)) + 1;

            var nextSlide;
            if (startIndex >= (currentSlideNum-1)) {
                //nextSlide = startIndex - currentSlideNum + 1;
                if (startIndex > totalSlides) {
                    nextSlide = totalSlides - 1;
                } else {
                    nextSlide = startIndex - 1;
                }
            } else {
                nextSlide = 0;
            }

            $('.pd-thumnail-image-gallery').slickGoTo(nextSlide);
        }
    }

    function updateCodeValue(that){
        var code = that.getAttribute("optionid");
        var group_name = that.getAttribute("name");
        code_value[code] = getSelectedValueByGroupname(group_name);
    }

    function getSelectedValueByGroupname(name){
        var ret = "null";
        $("span[name="+name+"]").each(function(){
            if($.inArray("pd-option-style-selected",this.classList) >= 0){
                ret = this.getAttribute("optionvalue");
                return;
            }
        });
        return ret;
    }

    function codeValueInit(){
        $(".pd_variants").each(function(){
            updateCodeValue(this);
            //init code_values, it is used for hidden options
            var code = this.getAttribute("optionid");
            code_values[code] = [];
            var group_name = this.getAttribute("name");
            $("span[name="+group_name+"]").each(function(){
                code_values[code].push(this.getAttribute("optionvalue"));
            });
            //end--init code_values
        });
        original_code_values = code_values;
    }

    function validVariant(){
        for(var code in code_value){
            if(code_value[code] === "null") {
                return false;
            }
        }
        return true;
    }

    function validInventory(){
        var inventory = Number($("#pd_inventory_var")[0].innerHTML);
        if(product["allowBackOrder"]){
            if(inventory <= 0){
                return false;
            }else{
                return true;
            }
        }else{
            if(inventory <= 0){
                return false;
            }else{
                return true;
            }
        }

        /* if (product["allowBackOrder"]) {
         return true;
         } else if (inventory <= 0) {
         return false;
         } else {
         return true;
         }
         return true;*/
    }

    function quantityEnough() {
        var num = Number($("#pd_quanity_var")[0].value);
        if(isNaN(num)) {
            return false;
        }

        var inventory = Number($("#pd_inventory_var")[0].innerHTML);

        if (num <= 0) {
            return false;
        }

        if (product["allowBackOrder"]) {
            return true;
        }

        if(num > inventory) {
            return false;
        }
        return true;
    }

    function disableBtn(e) {
        $(e).addClass("disabled");
        $(e)[0].style.background = "#dddddd";
        $(e)[0].style.borderColor = "#dddddd";
        $(e)[0].style.opacity = 1;
    }

    function enableBtn(e) {
        $(e).removeClass("disabled");
        $(e)[0].style.background = "";
        $(e)[0].style.borderColor = "";
    }
    function disableAddToCart(){
        disableBtn('#pd_addtocart_var');
        disableBtn('#pd_buynow_var');
    }

    function enableAddToCart(){
        enableBtn('#pd_addtocart_var');
        enableBtn('#pd_buynow_var');
    }

    function variantChangeAction(that) {
        if(!validVariant()){
            resetValue();
            updateAddToCart();
            return;
        }
        var variant = findVariant();
        if(variant === null){
            setValueZero();
            updateAddToCart();
        }
        else{
            selectedvariant = variant;
            setValueByVariant(variant);
        }
        updateAddToCart();
    }

    function setValueZero(){
        $("#pd_standardPrice_var")[0].innerHTML = "";
        $("#pd_price_var")[0].innerHTML = "N/A";
        $("#pd_inventory_var")[0].innerHTML = 0;
        $("#pd_quanity_var")[0].max = 0;
    }

    function resetValue(){
        $("#pd_standardPrice_var")[0].innerHTML = original_standard_price;
        $("#pd_price_var")[0].innerHTML = original_price;
        $("#pd_inventory_var")[0].innerHTML = original_inventory;

        $("#pd_quanity_var")[0].max = original_quantity_max;

        setStockStatus(parseInt(original_inventory));
    }

    function setValueByVariant(variant){
        $("#pd_standardPrice_var")[0].innerHTML = "";
        $("#pd_price_var")[0].innerHTML = "";
        var currency = store["currency"]["symbol"];
        if (currency === undefined || currency === null) {
            currency = '';
        }
        var priceFormatOptions = {
            decimalPlace: store.priceDecimalDigits,
            decimalSeparator: store.decimalSeparator,
            thousandsSeparator: store.thousandsSeparator
        };
        if (!isPriceEmpty(variant["salesPrice"])) {
            $("#pd_price_var")[0].innerHTML = currency + jsapi.formatPrice(variant["salesPrice"], priceFormatOptions);
            if (!isPriceEmpty(variant["standardPrice"]) && Number(variant["standardPrice"]) > Number(variant["salesPrice"])) {
                $("#pd_standardPrice_var")[0].innerHTML = currency + jsapi.formatPrice(variant["standardPrice"], priceFormatOptions);
            }
        } else if (!isPriceEmpty(variant["standardPrice"])) {
            $("#pd_price_var")[0].innerHTML = currency + jsapi.formatPrice(variant["standardPrice"], priceFormatOptions);
        } else {
            $("#pd_price_var")[0].innerHTML = currency;
        }

        $("#pd_inventory_var")[0].innerHTML = (variant["stockQuantity"] === null ? 0 : variant["stockQuantity"]);
        $("#pd_quanity_var")[0].max = variant["stockQuantity"];

        setVariantQuantity(variant);
    }

    function isPriceEmpty(price) {
        if (price !== null && price !== undefined && price !== '') {
            return false;
        }
        return true;
    }

    // set variant stock status
    function setVariantQuantity(variant){
        var available_quantity = variant["stockQuantity"];
        setStockStatus(parseInt(available_quantity));
    }

    function setStockStatus(stock_quantity) {
        var displayStr = '';
        if (themeOptions['anw-quantity-display'] == '1') {   // display stock message
            if (stock_quantity >= parseInt(themeOptions['anw-quantity-display-threshold'])) {
                displayStr = themeOptions['anw-quantity-display-more'];
            } else {
                displayStr = themeOptions['anw-quantity-display-less'];
            }
        }
        if (themeOptions['anw-quantity-display'] == '2') {  // display stock
            displayStr = (stock_quantity  >= 0) ? stock_quantity : 0;
        }

        $("#pd_productVariant_display")[0].innerHTML = displayStr;
    }

    // refresh product image according to selected variant
    function reSlickOptionImages(that) {

        var optioncode = that.getAttribute("optionid"),
            optionvaluecode = that.getAttribute("optionvalue");

        if (!isHasImageOption(optioncode)) {
            return ;
        }

        var selectOptionUrlList;
        selectOptionUrlList = hasOptionImage(optioncode, optionvaluecode);

        if (selectOptionUrlList && selectOptionUrlList.length > 0) {
            if($.inArray("pd-option-style-selected",that.classList) >= 0) {  // variant is selected.
                showProductImage();
                adjustGalleryImgs(selectOptionUrlList);
            } else {
                showProductImage();
            }
        }
    }

    function adjustGalleryImgs(selectURLList) {
        if ($('.pd-thumnail-image-gallery').find('.slick-slide').length > 0) {
            var startIndex = 0;
            $('.pd-thumnail-image-gallery').find('.slick-slide').each(function(el, index) {
                var slide = $(this);
                if (selectURLList.indexOf(slide.find('input')[0].value) !== -1) {
                    slide.attr('index', startIndex++);
                    if (!slide.hasClass('slick-active')) {
                        slide.addClass('slick-active');
                    }
                    if (startIndex === 1) {
                        slide.find('a').trigger('click');
                    }
                } else {
                    slide.remove();
                }
            });
            if (window.isPhone()) {
                var tx = "1 / " + selectURLList.length;
                $('#slick-slide-index').text(tx);
                $('.pd-thumnail-image-gallery').unslick();
                $('.pd-thumnail-image-gallery').slick({
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    unslicked: true,
                    focusOnSelect: true,
                    dots: false,
                    infinite: false,
                    arrows: false,
                    onAfterChange: procSlickChangeonPhone});
            } else {
                $('.pd-thumnail-image-gallery').unslick();
                activeImageSlick();
            }
        }
    }

    function showProductImage() {
        var clone = $.extend(true, {}, prductImagesGalleryEle.clone(true, true));
        $('.pd-thumnail-image-gallery').empty();
        $('.pd-thumnail-image-gallery').replaceWith(clone);
        if (window.isPhone()) {
            var tx = "1 / " + productListImageLen;
            $('#slick-slide-index').text(tx);
            $('.pd-thumnail-image-gallery').unslick();
            $('.pd-thumnail-image-gallery').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                unslicked: true,
                focusOnSelect: true,
                dots: false,
                infinite: false,
                arrows: false,
                onAfterChange: procSlickChangeonPhone});
        } else {
            $('.pd-thumnail-image-gallery').unslick();
            activeImageSlick();
        }

        $('.pd-thumnail-image-gallery').find('.slick-slide').each(function(el, index) {
            var slide = $(this);
            if (slide.attr('index') === '0') {
                slide.find('a').trigger('click');
                return false;
            }
        });
    }

    function codeInCode_Value(code,optioncode){
        if(code_value[optioncode] === code) {
            return true;
        }

        return false;
    }

    var match = false;
    function findVariant(){
        for (var index in variants) {
            var variant = variants[index];
            var var_list = variant["variantValues"];
            if (var_list === undefined || var_list === null) {   // the product self variant
                continue;
            }

            match = true;
            for (var i in var_list) {
                var item = var_list[i];
                if(!codeInCode_Value(item["id"],item["optionId"]))  //not selected
                {
                    match = false;
                    break;
                }
            }
            if(match === true){
                return variant;
            }
        }
        return null;
    }

    function refreshCodeValues(){
        code_values = {};
        for(var code in code_value){
            for(var index in variants){
                var variant = variants[index];
                var var_list = variant["variantValues"];

                match = true;
                for(var i in var_list){
                    var item = var_list[i];
                    var optioncode = item["optionId"];
                    if(code_value[optioncode] === "null" || optioncode === code) {
                        continue;
                    }
                    if(!codeInCode_Value(item["id"], optioncode)) {
                        match = false;
                        break;
                    }
                }
                if(match === true){    //if partitial match the variant
                    for(var j in var_list){
                        var item_inner = var_list[j];
                        var optioncodeValue = item_inner["optionId"];
                        if(optioncodeValue != code) {
                            continue;
                        }
                        if(!code_values.hasOwnProperty(optioncodeValue)){
                            code_values[optioncodeValue] = [];
                        }
                        if(code_values[optioncodeValue].indexOf(item_inner["id"]) < 0){
                            code_values[optioncodeValue].push(item_inner["id"]);
                        }
                    }
                }
            }
        }
        refreshOptionsStyle();
    }

    function refreshOptionsStyle(){
        var disabledClass= "pd-option-style-disabled";
        var traverse = function(){
            var value = this.getAttribute("optionvalue");
            if(code_values[code].indexOf(value) < 0){
                $("#"+this.id).addClass(disabledClass);
            }
            else{
                $("#"+this.id).removeClass(disabledClass);
            }
        };

        for(var code in code_values){
            $("span[optionid="+code+"]").each(traverse);
        }
    }

    function updateQuantity(value){
        var num = Number($("#pd_quanity_var")[0].value);
        var inventory = Number($("#pd_inventory_var")[0].innerHTML);
        num += value;

        if (num > 0) {
            if (product['allowBackOrder']) {
                $(".pd_quantity_number").each(function() {
                    this.value = num;
                });
                quantityChange(num);
            } else if (value < 0) {
                $(".pd_quantity_number").each(function() {
                    this.value = num;
                });
                quantityChange(num);
            } else if (num <= inventory) {
                $(".pd_quantity_number").each(function() {
                    this.value = num;
                });
                quantityChange(num);
            }
        }

    }
    window.updateQuantity = updateQuantity;


    function clearGroupOptions(that){
        var optionid = that.getAttribute("optionid");
        $("span[optionid="+optionid+"]").each(function(){
            $("#"+this.id).removeClass("pd-option-style-selected");
        });
    }

    function selectOption(that){
        //alert(that.id);
        if($.inArray("pd-option-style-disabled",that.classList) > 0){
            return;
        }
        if($.inArray("pd-option-style-selected",that.classList) < 0){
            clearGroupOptions(that);
            $("#"+that.id).addClass("pd-option-style-selected");
            changeImg(that);
        }
        else {
            //unselect a option
            clearGroupOptions(that);
            var imgUrl = product.featuredImage;
            document.getElementsByClassName('twowidefiller twohighfiller contentpane')[0].setAttribute("style", "background-image: url('" + imgUrl + "')");
        }
        variantChange(that);
        reSlickOptionImages(that);
    }
    function changeImg(that){
        var imgEle = $(that).find('img');
        if(imgEle.length){
            var imgUrl = imgEle.attr("src");
            var imgUrlLarge = imgUrl.replace(/FINGERNAIL/,'LARGE');
            var imgUrlXLarge = imgUrl.replace(/LARGE/,'XLARGE');
            $('.twowidefiller:first').attr("style", "background-image: url('" + imgUrlLarge + "')");
            $('.swipebox:first').attr("href",imgUrlLarge);
        }
    }



    function keyboardSelect(that, ev) {
        if (ev.which === 13) {//enter key
            selectOption.apply(null, [that]);
        }
    }

    window.selectOption = selectOption;
    window.keyboardSelect = keyboardSelect;


    function canAdd2Cart(){

        var unSelectedVariants = getUnselectedVariant();
        if(unSelectedVariants.length>0){
            var variantName =unSelectedVariants.join('/');
            if(device.isPhone){
                $('#add-status-icon').removeClass('icon-success');
                $('#add-status-icon').addClass('icon-close');
                $('#add-status-message')[0].innerHTML = i18n['add2cart.warning.select.variant'] + variantName + i18n['common.full.stop']  ;
                showAddToCartPopup();
                setTimeout(hideAddToCartPopup, 2000);
            }else{
                warningSelectVariant(variantName);
            }

            return false;
        }
        var price;
        if(product.hasVariants){
            price= parseFloat($.trim(selectedvariant.salesPrice));
        }else {
            price= parseFloat($.trim(product.salesPrice));
        }


        if(isNaN(price) || isPriceEmpty(price)){
            if(device.isPhone){
                $('#add-status-icon').removeClass('icon-success');
                $('#add-status-icon').addClass('icon-close');
                $('#add-status-message')[0].innerHTML = i18n['add2cart.warning.no.price'];
                showAddToCartPopup();
                setTimeout(hideAddToCartPopup, 2000);
            }else{
                warningNoPrice();
            }

            return false;
        }
        /* console.log(validInventory());*/
        if(!validInventory()){
            if(device.isPhone){
                $('#add-status-icon').removeClass('icon-success');
                $('#add-status-icon').addClass('icon-close');
                $('#add-status-message')[0].innerHTML = i18n['add2cart.warning.sold.out'];
                showAddToCartPopup();
                setTimeout(hideAddToCartPopup, 2000);
            }else{
                updateAddToCart();/*jamie新加*/
                warningSoldOut();
            }
            return false;
        }
        if (!quantityEnough()) {
            if(device.isPhone){
                $('#add-status-icon').removeClass('icon-success');
                $('#add-status-icon').addClass('icon-close');
                $('#add-status-message')[0].innerHTML = i18n['add2cart.warning.quantity.exceeds'];
                showAddToCartPopup();
                setTimeout(hideAddToCartPopup, 2000);
            }else{
                warningQuantityExceed();
            }

            return false;
        }

        if(!validVariant())
        {
            if(device.isPhone){
                $('#add-status-icon').removeClass('icon-success');
                $('#add-status-icon').addClass('icon-close');
                $('#add-status-message')[0].innerHTML = i18n['pd.select.valid.variant'];
                showAddToCartPopup();
                setTimeout(hideAddToCartPopup, 2000);
            }
            return false;
        }


        return true;
    }

    function buynow(e) {
        e.preventDefault();
        if(canAdd2Cart() === false) {
            return ;
        }
        var quantity = $("#pd_quanity_var")[0].value;

        var product_id = null;
        if(product["hasVariants"]){
            product_id = selectedvariant["skuId"];
        } else {
            product_id = variants[0]['skuId'];
        }

        jsapi.add2Cart(product_id, quantity).done(function(){
            window.location.href = store.httpLink + "/cart";
        }).fail(function(){
            $('#add-status-icon').removeClass('icon-success');
            $('#add-status-icon').addClass('icon-close');
            $('#add-status-message')[0].innerHTML = i18n['product.detail.add2cart.fail'];
            showAddToCartPopup();
            setTimeout(hideAddToCartPopup, 2000);
        });
    }
    function add2cart(e) {
        /* console.log(canAdd2Cart());*/
        if(canAdd2Cart() === false) {
            return ;
        }
        var quantity = $("#pd_quanity_var")[0].value;

        var skuId = null;
        if(product["hasVariants"]){
            skuId = selectedvariant["skuId"];
        } else {
            skuId = variants[0]['skuId'];
        }

        jsapi.add2Cart(skuId, quantity).done(function(rsp){
            var cartCount = parseInt(rsp.count);
            setGlobalCartCount(cartCount);
        }).fail(function(rsp){
            $('#add-status-icon').removeClass('icon-success');
            $('#add-status-icon').addClass('icon-close');
            $('#add-status-message')[0].innerHTML = i18n['product.detail.add2cart.fail'];
            showAddToCartPopup();
            setTimeout(hideAddToCartPopup, 2000);
        });

        addToCartAnimation(e);
    }

    var addToCartAnimation = function(event) {
        disableAddToCart();
        var offset = $(".cart-global").offset();
        var buttonOffset = $(event.target).offset();
        var buttonWidth = $(event.target).width();
        var flyer = $('#cart-animation').text($("#pd_quanity_var")[0].value);
        flyer.show();
        flyer.fly({
            start: {
                left: buttonOffset.left + (buttonWidth / 2),
                top: buttonOffset.top - 30 -  window.pageYOffset
            },
            end: {
                left: offset.left ,
                top: offset.top - window.pageYOffset ,
                width: 35,
                height: 35
            },
            vertex_Rtop: 10,
            speed: 1.0,
            onEnd: function() {
                flyer.fadeOut(1000);
                setTimeout(enableAddToCart, 1000);
            }
        });
    };

    var getPromotions = function(){
        jsapi.getPromotions(product.id).done(renderPromotions);
        // jsapi.getPromotions(100000000000522).done(renderPromotions);
    };

    var renderPromotions = function(promotions){
        var promotionsTemplate;
        if(window.isPhone()){
            promotionsTemplate = Handlebars.compile($("#mobilePromotionsTemplate").text());
        }else{
            promotionsTemplate = Handlebars.compile($("#promotionsTemplate").text());
        }

        if(promotions && promotions.length >0){
            $(".promotions").html(promotionsTemplate({promotions: promotions})).show();
        }
    };

    window.add2cart = add2cart;

    function thumbnailImageChange(that) {
        $("#pd_boothimage")[0].src = that.src;
    }
    window.thumbnailImageChange = thumbnailImageChange;

    window.warningSelectVariant = function (variantName) {
        /*$('.add2cart-warning').text(i18n['add2cart.warning.select.variant'] + variantName + i18n['common.full.stop']);*/
        $('.add2cart-warning').show();
    };

    window.warningNoPrice = function () {
        $('.add2cart-warning').text(i18n['add2cart.warning.no.price']);
        $('.add2cart-warning').show();
    };

    window.warningSoldOut = function () {
        $('.add2cart-warning').text(i18n['add2cart.warning.sold.out']);
        $('.add2cart-warning').show();
    };

    window.warningQuantityExceed = function () {
        $('.add2cart-warning').text(i18n['add2cart.warning.quantity.exceeds']);
        $('.add2cart-warning').show();
    };

    window.hideWarning = function () {
        $('.add2cart-warning').hide();
    };

    function getUnselectedVariant(){
        var unselectedvariant = [];
        $('#pd_productVariant .row').filter(function(){
            return $(this).has('.pd-options-content .pd-option-style-selected').length <= 0;
        }).find('.pd-variant-opt').each(function(){
            unselectedvariant.push($.trim($(this).text()));
        });

        return unselectedvariant;
    }

    $(document).ready(function(){
        initSortPanel();
        procProductDetailFrontend();
    });

})(jQuery, window);