(function ($, exports) {
    "use strict";

    //0 => all, 1 => product, 2 => post, 3 -> page
    var selected = 0;
    var isPhone = $('body').hasClass('phone');
    var productPaged = 1;
    var postPaged = 1;
    var pagePaged = 1;
    var isLoadingMoreProduct = false;
    var isLoadingMorePost = false;
    var isLoadingMorePage = false;
    var noMoreProductToLoad = false;
    var noMorePostToLoad = false;
    var noMorePageToLoad = false;
    var lineHeight = 20;
    var INIT_PRODUCT_COUNT = 16;
    var INIT_POST_COUNT = 3;
    var INIT_PAGE_COUNT = 3;

    var initElements = function () {
        calculatePostItemHeight();
    };

    var bindEvents = function () {
        $('.search-menu-item').on("click", function (event) {
            var self = $(this);
            //jump to top
            $('body').animate({scrollTop: 0}, 'fast', "linear", function () {
                selected = self.data('menu-type');
                handleMenuEvent(event);
            });
        });
        //load more
        $('.load-more').on("click", loadMore);
        //bind scroll to bottom event
        $(window).on("scroll", function () {
            if ($(window).scrollTop() + $(window).height() === $(document).height()) {
                loadMore();
            }
        });
        //toggle drop down menu on phone
        if (isPhone) {
            $('.search-menu').on("click", function (event) {
                $('.search-drop-down-content').toggle();
                event.stopPropagation();
            });
            $('body').on("click", function () {
                $('.search-drop-down-content').hide();
            });
        }
        //bind show products button
        $('.show-all-products').on("click", function () {
            $(".search-menu-item-product").trigger("click");
        });
        //bind show articles button
        $('.show-all-posts').on("click", function () {
            $(".search-menu-item-article").trigger("click");
        });
        //bind show pages button
        $('.show-all-pages').on("click", function () {
            $(".search-menu-item-page").trigger("click");
        });
    };

    var calculatePostItemHeight = function () {
        $('.post-item').each(function () {
            var featuredImg = $(this).find('img');
            var wrapper = $(this).find('.post-content-text');
            var height = 0;
            if (featuredImg && featuredImg.width() === wrapper.width()) {
                height = Math.ceil((wrapper.height() - featuredImg.height()) / lineHeight) * lineHeight + featuredImg.height();
            } else {
                height = Math.ceil(wrapper.height() / lineHeight) * lineHeight;
            }
            wrapper.height(height).css("max-height", height + "px");
        });
    };

    var loadMore = function () {
        if (selected === 1) {
            //switch to load image
            $('.load-more-product').find('.load-more-icon').addClass("icon-spin");
            //real load
            loadMoreProducts();
        } else if (selected === 2) {
            //switch to load image
            $('.load-more-post').find('.load-more-icon').addClass("icon-spin");
            //real load
            loadMorePosts();
        } else if (selected === 3) {
            //switch to load image
            $('.load-more-page').find('.load-more-icon').addClass("icon-spin");
            //real load
            loadMorePages();
        }
    };

    var handleMenuEvent = function (event) {
        var selectedDom = $(event.target);
        if (selectedDom.hasClass('selected')) {
            return;
        }
        var oldDom = $('.selected');
        //search product page
        if (selected === 1) {
            $('.product-list-item').show();
            $('.search-products').show();
            //init images
            exports.resizeImage($('.product-list-items'));
            exports.initLazyImage($('.product-list-items'));
        } else {
            $('.search-products').hide();
        }
        //search post page
        if (selected === 2) {
            $('.post-item').show();
            $('.search-articles').show();
        } else {
            $('.search-articles').hide();
        }
        //search page page
        if (selected === 3) {
            $('.page-item').show();
            $('.search-pages').show();
        } else {
            $('.search-pages').hide();
        }
        //display fixed number of items when click tab all
        if (selected === 0) {
            displayFixCountItems();
        } else {
            $('.show-all').hide();
        }
        //load more
        $('.load-more').hide();
        if (selected === 1) {
            if ($('.product-list-item').length < parseInt($('#product_total_count').val())) {
                $('.load-more-product').show();
            }
        } else if (selected === 2) {
            if ($('.post-item').length < parseInt($('#post_total_count').val())) {
                $('.load-more-post').show();
            }
        } else if (selected === 3) {
            if ($('.page-item').length < parseInt($('#page_total_count').val())) {
                $('.load-more-page').show();
            }
        }
        if (isPhone) {
            //swap content
            var tmp = selectedDom.html();
            selectedDom.html(oldDom.html());
            oldDom.html(tmp);
            //swap menu type
            tmp = selectedDom.data('menu-type');
            selectedDom.data('menu-type', oldDom.data('menu-type'));
            oldDom.data('menu-type', tmp);
            //hide menu
            $('.search-drop-down-content').hide();
        } else {
            //reset selected class
            oldDom.removeClass("selected");
            selectedDom.addClass("selected");
        }
        event.stopPropagation();
    };

    var loadMoreProducts = function () {
        if (noMoreProductToLoad) {
            return;
        }
        if (isLoadingMoreProduct) {
            return;
        } else {
            isLoadingMoreProduct = true;
        }
        $(".load-more-product .load-more-text").html(i18n['productlist.loadingmore']);
        productPaged++;
        jsapi.searchProducts(window.searchWords, productPaged)
            .done(function (data) {
                if (data.products && data.products.length > 0) {
                    var source = $("#products_template").html();
                    var template = Handlebars.compile(source);
                    var html = template({products: data.products, store: window.store});
                    var $list = $('.product-list-items');
                    var dom = $list.append(html);
                    exports.resizeImage(dom);
                    exports.initImageHolder(dom);
                    exports.initLazyImage(dom);
                }
                if (data.products && data.products.length < 16) {
                    $('.load-more-product').find('.load-more-icon').hide();
                    $('.load-more-product').find('.load-more-text').hide();
                    noMoreProductToLoad = true;
                }
            })
            .fail(function () {
                $(".load-more-product .load-more-text").html(i18n['productlist.retry']);
            })
            .always(function () {
                $(".load-more-product .load-more-icon").removeClass("icon-spin");
                $(".load-more-product .load-more-text").html(i18n['productlist.loadmore']);
                isLoadingMoreProduct = false;
            });
    };

    var loadMorePosts = function () {
        if (noMorePostToLoad) {
            return;
        }
        if (isLoadingMorePost) {
            return;
        } else {
            isLoadingMorePost = true;
        }
        $(".load-more-post .load-more-text").html(i18n['productlist.loadingmore']);
        postPaged++;
        jsapi.searchPosts(window.searchWords, postPaged)
            .done(function (data) {
                if (data.posts && data.posts.length > 0) {
                    var source = $("#posts_template").html();
                    var template = Handlebars.compile(source);
                    var html = template({posts: data.posts});
                    var $t = $(html);
                    //$t.find("time").each(function () {
                    //    var segs = $(this).text().trim().split(' ');
                    //    var date = new Date(segs[0] + 'T' + segs[1] + '.000Z');
                    //    $(this).text(date.format('yyyy-MM-dd hh:mm:ss'));
                    //});
                    var $list = $('.post-items');
                    $list.append($t);
                }
                if (data.posts && data.posts.length < 3) {
                    $('.load-more-post').find('.load-more-icon').hide();
                    $('.load-more-post').find('.load-more-text').hide();
                    noMorePostToLoad = true;
                }
            })
            .always(function () {
                $(".load-more-post .load-more-icon").removeClass("icon-spin");
                $(".load-more-post .load-more-text").html(i18n['productlist.loadmore']);
                isLoadingMorePost = false;
            });
    };

    var loadMorePages = function () {
        if (noMorePageToLoad) {
            return;
        }
        if (isLoadingMorePage) {
            return;
        } else {
            isLoadingMorePage = true;
        }
        $(".load-more-page .load-more-text").html(i18n['productlist.loadingmore']);
        pagePaged++;
        jsapi.searchPages(window.searchWords, pagePaged)
            .done(function (data) {
                if (data.pages && data.pages.length > 0) {
                    var source = $("#pages_template").html();
                    var template = Handlebars.compile(source);
                    var html = template({pages: data.pages, store: window.store});
                    var $list = $('.page-items');
                    $list.append(html);
                }
                if (data.pages && data.pages.length < 3) {
                    $('.load-more-page').find('.load-more-icon').hide();
                    $('.load-more-page').find('.load-more-text').hide();
                    noMorePostToLoad = true;
                }
            })
            .always(function () {
                $(".load-more-page .load-more-icon").removeClass("icon-spin");
                $(".load-more-page .load-more-text").html(i18n['productlist.loadmore']);
                isLoadingMorePage = false;
            });
    };

    var displayFixCountItems = function () {
        //display products
        displayHelper($('.product-list-item'), INIT_PRODUCT_COUNT);
        //display posts
        displayHelper($('.post-item'), INIT_POST_COUNT);
        //display pages
        displayHelper($('.page-item'), INIT_PAGE_COUNT);
        //display search all
        $('.show-all').show();
        //display wrapper
        $('.search-products').show();
        $('.search-articles').show();
        $('.search-pages').show();
    };

    var displayHelper = function (items, total) {
        var count = 0;
        for (var i = 0; i < items.length; i++) {
            if (count < total) {
                $(items[i]).show();
            } else {
                $(items[i]).hide();
            }
            count++;
        }
    };

    $(function () {
        initElements();
        bindEvents();
    });

})(jQuery, window);