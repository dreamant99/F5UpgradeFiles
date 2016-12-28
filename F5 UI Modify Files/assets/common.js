/**
 * Created by I311667 on 7/30/2015.
 */
(function ($, exports) {
    'use strict';

    var jsapi = new JSAPI({
        host: window.siteurl,
        securityToken: window.securityToken,
        timeout: 10000 // 10 seconds
    });

    $("#ajax_common_modal").on("hide.bs.modal", function () {
        var $this = $(this);
        $this.find(".modal-title").text("");
        $this.find(".modal-body").text("");
        $this = null;
    });
    var ajaxAlert = function (title, body) {
        var $modal = $("#ajax_common_modal");
        $modal.find(".modal-title").text(title);
        $modal.find(".modal-body").html(body);
        $modal.modal();
    };

    /* shopping cart count */
    var setGlobalCartCount = function (cartCount) {
        if (!jQuery.isNumeric(cartCount) || (cartCount < 0)) {
            return;
        }

        var cart = jQuery(".cart-global-item-count");
        if (cart.length === 0) {
            return;
        }

        cart.text((cartCount > 99) ? "99+" : cartCount.toString());
    };

    var initCartCount = function () {
        jsapi.getCartCount()
            .done(function (data) {
                var cartCount = parseInt(data.count);
                $(function(){
                    if ($.isNumeric(cartCount)) {
                        setGlobalCartCount(cartCount);
                    }
                });
            }).fail(function () {
            /* always set to zero no matter what kind of error happend */
            setGlobalCartCount(0);
        });
    };

    var initSearchBox = function () {
        var enterEventCount = 0;
        var focusInFunc = function () {
            $(this).addClass('search-focus');
            enterEventCount++;
        };
        var focusOutFunc = function () {
            enterEventCount--;
            if (enterEventCount === 0) {
                $(this).removeClass('search-focus');
            }
        };
        $('.search-wrapper')
            .focusin(focusInFunc)
            .focusout(focusOutFunc)
            .hover(focusInFunc, focusOutFunc);
    };

    var VALIDATION_OPTIONS = {
        submitHandler: function(form){
            if($(form).valid()){
                form.submit();
            }
        },
        highlight: function(element){
            $(element).parents(".form-group").addClass("has-error");
        },
        unhighlight: function(element){
            $(element).parents(".has-error").removeClass("has-error");
        }
    };
    $.validator.setDefaults(VALIDATION_OPTIONS);
    $.validator.addMethod("date", function (value, element){
        return this.optional(element) || (new Date(value) !== "Invalid Date");
    });
    /**
     * @param form the object of form, you can use jquery to select, e.g. resetFormValidate( $('#my_form') )
     */
    exports.resetFormValidate = function (form) {
        $(form).valid();
    };

    var HOLDER_BG_COLOR = "f5f5f5";
    var HOLDER_FG_COLOR = "a9a9a9";
    var HOLDER_DEFAULT_SIZE = 18;
    var resizeImage = function (e) {
        var $wrappers = $(e).hasClass("img-wrapper") ? $(e)
            : $(e).find(".img-wrapper");
        $wrappers.each(function (i, wrapper) {
            var $wrapper = $(wrapper);
            var $container = $wrapper.closest(".img-container");
            var width = $wrapper.innerWidth();
            var ratio = $container.data("ratio") || 1;
            var holderSize = $container.data("holderSize") || HOLDER_DEFAULT_SIZE;
            var height = width * ratio;
            $wrapper.height(height);

            var icon = $wrapper.find('i');
            if (icon !== undefined && icon !== null) {
                icon.css({'padding-top': (height - icon.height()) / 2});
            }

            $container.css({"visibility": "visible"});
            var $img = $wrapper.find("img");
            $img.attr("src", "holder.js/" + width + "x" + height + "?auto=yes&bg=" + HOLDER_BG_COLOR + "&fg=" + HOLDER_FG_COLOR + "&text=No Image&size=" + holderSize);
            Holder.setResizeUpdate($img, false);

            var product_price_grid = $container.find('.product-price-grid');
            product_price_grid.height(Math.floor(product_price_grid.height()));
        });
        $('.img-container').css({"visibility": "visible"});
    };
    var initWindowResize = function (e) {
        var resizeImageTimeout = null;
        $(window).on("resize", function () {
            if (resizeImageTimeout) {
                window.clearTimeout(resizeImageTimeout);
            }
            resizeImageTimeout = setTimeout(function () {
                resizeImage(".img-container");
                initImageHolder(".img-container");
                initLazyImage(".img-container");
            }, 500);

            judgeOrientation();
        });
    };

    var initImageHolder = function (e) {
        var holders = $(e).find('img');
        for (var i = 0; i < holders.length; i++) {
            Holder.run({
                images: holders.get(i)
            });
        }

    };

    var initLazyImage = function (e) {
        var $target = $(e).find("*:not(.self-control-lazy-load) [data-original]");
        $target.lazyload({
            effect: "fadeIn",
            skip_invisible: false,
            threshold: 0,
            failure_limit: 10
        });
        $("div.img-lazy").lazyload({
            effect: "fadeIn",
            skip_invisible: false,
            threshold: 0,
            failure_limit: 10
        });
        $("img.img-lazy").lazyload({
            effect: "fadeIn",
            skip_invisible: false,
            threshold: 0,
            failure_limit: 10
        });
    };

    var initBackToTop = function (e) {
        $(e).find(".back-to-top a").click(function () {
            $('body,html').animate({
                scrollTop: 0
            }, 500);
        });
    };

    /**
     * Init search button function.
     */
    var initSearchButton = function () {
        $('.icon-search').click(function () {
            $('.search-form').submit();
        });
    };


    /**
     * Init menu on PC.
     */
    var initPCMenu = function () {
        $('.dropdown-head').on('mouseenter', function (e) {
            var dropdown = $(this).find('.dropdown');
            if (typeof dropdown !== 'undefined' && dropdown !== null) {
                if (dropdown.hasClass('products')) {  // has image in submenu
                    dropdown.css('visibility', 'hidden');
                    var item = dropdown.find('li');
                    item.css('visibility', 'hidden');
                    dropdown.show();
                    resizeImage(dropdown);
                    if (exports.isDesktop()) {
                        dropdown.css({
                            top: ($(this).position().top + $(this).outerHeight()) + 'px'
                        });
                    }
                    dropdown.css('visibility', 'visible');
                    item.css('visibility', 'visible');
                } else {  // no image in submenu
                    if (exports.isDesktop()) {
                        dropdown.css({
                            top: ($(this).position().top + $(this).outerHeight()) + 'px'
                        });
                    }
                }
            }
        });
    };

    /**
     * Init menu on pad.
     *
     * @param e
     */
    var initPadMenu = function () {
        $(".pad .side-menu-trigger").on('click', function (e) {
            e.stopPropagation();
            var home_meu = $(".home-menu");
            if (home_meu.css("display") === "none") {
                home_meu.css("display", 'block');
            } else {
                home_meu.css("display", 'none');
            }
        });

        $('nav.main').on('click', function (e) {
            e.stopPropagation();
        });

        $('body').on('click', function (e) {
            var home_meu = $(".home-menu");
            home_meu.css("display", 'none');
        });
    };

    /**
     * Init menu on phone
     *
     * @param e
     */
    var initPhoneMenu = function (e) {
        var $e = $(e);
        var $sideMenu = $e.find(".side-menu", ".phone");
        $sideMenu.mmenu({
            searchfield: false,
            header: false,
            "extensions": [
                "theme-dark"
            ],
            fixedElements: {
                fixedTop: "banner-top"
            },
            offCanvas: {
                zposition: "front"
            },
            "navbar": false,
            //footer: {
            //    "add": true,
            //    "title": i18n['home.label.copyright']
            //}
        });

        var API = $sideMenu.data("mmenu");
        API.bind("closed", function () {
            $sideMenu.hide();
        });
        $sideMenu.find(".mm-subopen").addClass("mm-fullsubopen");
        $e.find(".side-menu-trigger", ".phone").click(function () {
            if ($sideMenu.is(":hidden")) {
                $sideMenu.show();
            }
            API.open();
        });

        // click main menu
        $('li.main-menu').click(function () {
            var mainmenu = $(this);
            var submenu = mainmenu.next();
            if (typeof submenu !== 'undefined' && submenu !== null && submenu.hasClass('submenu')) {
                mainmenu.toggleClass('active');
                var icon = mainmenu.find('i');
                icon.toggleClass('icon-downwardarrow icon-upwardarrow');
                var currentStatus = submenu.css('display');
                if (currentStatus !== 'none') {
                    submenu.slideUp();
                } else {
                    $('ul.submenu').each(function () {
                        if ($(this).css('display') !== 'none') {
                            $(this).css('display', 'none');
                            var corresMainmenu = $(this).prev();
                            if (typeof corresMainmenu !== 'undefined' && corresMainmenu !== null && corresMainmenu.hasClass('main-menu')) {
                                corresMainmenu.toggleClass('active');
                            }
                        }
                    });
                    submenu.slideDown();
                    if (submenu.hasClass('products')) {
                        resizeImage(submenu);
                    }
                }
            }
        });
    };

    function swapArrowType(obj) {
        if (obj.hasClass('icon-downwardarrow')) {
            obj.removeClass('icon-downwardarrow');
            obj.addClass('icon-upwardarrow');
        } else {
            obj.removeClass('icon-upwardarrow');
            obj.addClass('icon-downwardarrow');
        }
    }

    var initAddressEdit = function (e) {
        var $e = $(e);
        $e.find("#address-edit-form-ship", ".phone").mmenu({
            "extensions": [
                "theme-white",
                "fullscreen"
            ],
            navbar: false,
            offCanvas: {
                position: "left",
                zposition: "front"
            }
        }, {
            transitionDuration: 10,
            offCanvas: {
                pageSelector: "> #page"
            }
        });
        $e.find("#address-edit-form-bill", ".phone").mmenu({
            "extensions": [
                "theme-white",
                "fullscreen"
            ],
            navbar: false,
            offCanvas: {
                position: "left",
                zposition: "front"
            }
        }, {
            transitionDuration: 10,
            offCanvas: {
                pageSelector: "> #page"
            }
        });

    };

    //disable autocomplete for password filed
    $('input[type=password]').each(function () {
        $('<input type="password" style="display: none;">').insertBefore($(this));
    });


    var isMobile = function () {
        return $(document.body).hasClass("mobile");
    };

    var isPad = function () {
        return $(document.body).hasClass("pad");
    };

    var isPhone = function () {
        return $(document.body).hasClass("phone");
    };

    var isDesktop = function () {
        return $(document.body).hasClass("desktop");
    };

    var isLandscape = function () {
        return $(document.body).hasClass("landscape");
    };

    var isPortrait = function () {
        return $(document.body).hasClass("portrait");
    };

    exports.initDropDown = function () {
        // init the width of dropdown list
        var width = $('.current .item').outerWidth();
        if (width > 0) {
            $('.drop-down .item').css("width", width + 0.5);
        }

        //click event on item of drop down list
        $('a.currency-item').click(function (e) {
            jsapi.setCurrency($(this).attr("data-code")).done(function () {
                window.location.reload();
            });
        });

        //init click event
        $('.mc-current').on("click", function () {
            $('.mc-dropdown').toggle();
        });
    };

    var initToggle = function () {
        $('.current').click(function () {
            $('.drop-down').toggle();
            $('.currency-icon .icon-dropdownarrow, .currency-icon .icon-upwardarrow').toggle();
        });
    };

    /*
     * compare the width and height to judge orientation
     * then add "landscape" or "portrait" css class to <body>.
     */
    exports.judgeOrientation = function () {

        // for mobile orientation, if 'mobile' class exists, campare the window.height and window.width to judge screen orientation
        if ($(document.body).hasClass('mobile')) {
            var deviceWidth = window.innerWidth;
            var deviceHeight = window.innerHeight;

            if (deviceHeight > deviceWidth) {
                if ($(document.body).hasClass('landscape')) {
                    $(document.body).removeClass('landscape');
                }
                $(document.body).addClass('portrait');
            } else {
                if ($(document.body).hasClass('portrait')) {
                    $(document.body).removeClass('portrait');
                }
                $(document.body).addClass('landscape');
            }
        }
    };

    //disable autocomplete for password filed
    var disableAutocomplete = function () {
        $('input[type=password]').each(function () {
            $('<input type="password" style="display: none;">').insertBefore($(this));
        });
    };

    initCartCount();
    $(function () {
        resizeImage(document.body);
        initLazyImage(document.body);
        initImageHolder(document.body);
        initWindowResize();
        judgeOrientation();
        initPCMenu(document.body);
        if (exports.isPad()) {
            initPadMenu(document.body);
        }
        if (exports.isPhone()) {
            initPhoneMenu(document.body);
            initAddressEdit(document.body);
        }

        initBackToTop(document.body);
        initSearchButton();

        // some special just for phone
        if (exports.isPhone()) {
            initAddressEdit();
        }
        initBackToTop();
        disableAutocomplete();
        initDropDown();
        //initLocalTimezone();
    });
    Handlebars.registerHelper('priceFormatter', function (price) {
        if (price === '') {
            return window.store.currency.symbol + price;
        }
        return window.store.currency.symbol + jsapi.formatPrice(price, {
                decimalPlace: store.priceDecimalDigits,
                decimalSeparator: store.decimalSeparator,
                thousandsSeparator: store.thousandsSeparator});
    });
    Handlebars.registerHelper('imgUrl', function (imgUrl, scale) {
        if (scale) {
            return jsapi.getProductImageByScale(imgUrl, scale);
        }
        return "";
    });
    Handlebars.registerHelper('t', function (key) {
        if (i18n && key) {
            return i18n[key];
        }
        return "";
    });
    Handlebars.registerHelper('siteUrl', function (url) {
        if (url) {
            return window.siteurl + "/" + url;
        }
        return window.siteurl;
    });
    Handlebars.registerHelper('showSalesStamp', function (standardPrice, salesPrice, options) {
        if (parseFloat(standardPrice) > parseFloat(salesPrice)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    Handlebars.registerHelper('gt', function (v1, v2, options) {
        if (parseFloat(v1) > parseFloat(v2)) {
            return options.fn(this);
        } else {
            return options.inverse(this);
        }
    });
    Handlebars.registerHelper('datetimeFormat', function(timestamp) {
        var datetime = new Date(timestamp * 1000);
        return datetime.format("yyyy-M-dd hh:mm");
    });

    //var initLocalTimezone = function () {
    //    $('time').each(function () {
    //        var segs = $(this).text().trim().split(' ');
    //        var date = new Date(segs[0] + 'T' + segs[1] + '.000Z');
    //        $(this).text(date.format('yyyy-MM-dd hh:mm:ss'));
    //    });
    //};
    exports.ajaxAlert = ajaxAlert;
    exports.initSearchBox = initSearchBox;
    exports.initImageHolder = initImageHolder;
    exports.initLazyImage = initLazyImage;
    exports.isMobile = isMobile;
    exports.isPad = isPad;
    exports.isPhone = isPhone;
    exports.isDesktop = isDesktop;
    exports.isLandscape = isLandscape;
    exports.isPortrait = isPortrait;
    exports.resizeImage = resizeImage;
    exports.setGlobalCartCount = setGlobalCartCount;
    exports.jsapi = jsapi;

    Date.prototype.format = function (format) {
        var o = {
            "M+": this.getMonth() + 1, // month
            "d+": this.getDate(), // day
            "h+": this.getHours(), // hour
            "m+": this.getMinutes(), // minute
            "s+": this.getSeconds(), // second
            "q+": Math.floor((this.getMonth() + 3) / 3), // quarter
            "S": this.getMilliseconds()
            // millisecond
        };
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    };

})(jQuery, window);