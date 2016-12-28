(function ($, exports) {
    "use strict";

    var currentPage = 1;
    var isLoadingMore = false;
    var nothingToLoad = false;
    var bodyHeight;

    var initSidebar = function () {
        //check if need sidebar
        if (exports.isDesktop()) {
            if ($('.sub-menu-list > ul').length === 0) {
                $('.sub-menu-list').remove();
                $('.product-list-main').css('border', 0).css('padding-left', 0);
                //init images
                exports.resizeImage('.img-container');
                exports.initImageHolder('.img-container');
                exports.initLazyImage('.img-container');
            } else {
                var activeMenu = $('.active-menu');
                if (activeMenu.length === 1) {
                    var parentSiderbar = activeMenu.parent();
                    parentSiderbar.find('.icon').removeClass('icon-rightwardarrow').addClass('icon-downwardarrow');
                    parentSiderbar.find('.sub-menu').each(function () {
                        $(this).show();
                    });
                }
            }
        }
    };
    var viewMoreVariants = function () {
        $(this).closest(".option-wrapper").find(".option-value-wrapper").toggleClass("single-line");
    };
    var bindPhoneEvents = function () {
        $('.filter-btn').on("click", function () {
            if ($('.variant-filter').length > 0) {
                enableModal($('.product-filter-modal'));
            }
        });
        //bind sort button
        $('.sort-btn').on("click", function () {
            enableModal($('.product-sort-modal'));
        });
        //bind category button
        $('.category-btn').on("click", function () {
            enableModal($('.product-category-modal'));
        });
        //bind cancel button
        $('.modal-cancel').on("click", function () {
            disableModal($('.product-list-modal'));
        });
        //bind done button
        $('.modal-done').on("click", function () {
            $("#variant_form").submit();
        });
        //bind toggle event
        $('.toggle-option').on("click", function () {
            var self = $(this);
            if (self.hasClass("unwind")) {
                self.find('icon').removeClass("icon-rightwardarrow").addClass("icon-downwardarrow");
                $(this).removeClass("unwind");
            } else {
                self.find('icon').removeClass("icon-downwardarrow").addClass("icon-rightwardarrow");
                $(this).addClass("unwind");
            }
            $(this).next().toggle("fast");
        });
    };

    var bindEvents = function () {
        if (exports.isPhone()) {
            bindPhoneEvents();
        } else {
            //bind click event to view more variant button
            $('.view-more').on("click", viewMoreVariants);
            //bind window resize event
            var resizeTimeout = null;
            $(window).on("resize", function () {
                if (resizeTimeout) {
                    window.clearTimeout(resizeTimeout);
                }
                resizeTimeout = setTimeout(calcShowMore, 500);
            });
        }
        //bind variant value click event
        if(!exports.isPhone()){
            $('.sort-filter,.variant-filter').find('input[type=checkbox], input[type=radio]').on("change", function () {
                $("#variant_form").submit();
            });
        }
        //bind load more icon
        $('.load-more').on("click", loadMore);
        //bind scroll to bottom event
        $(window).on("scroll", function () {
            if ($(window).scrollTop() + $(window).height() === $(document).height()) {
                loadMore();
            }
        });
        //bind main menu toggle
        $('.product-list-wrapper .main-menu').on("click", function () {
            $(this).parent().find('.sub-menu').toggle();
            var icon = $(this).find('.icon');
            if(icon.hasClass("icon-rightwardarrow")){
                icon.removeClass("icon-rightwardarrow").addClass("icon-downwardarrow");
            }else{
                icon.removeClass("icon-downwardarrow").addClass("icon-rightwardarrow");
            }
        });

        // bind category
        $('.product-categories li').on('click', function (event) {
            event.stopPropagation();
            var layerCode = $(this).data('layer');
            $(".category-filter").remove();
            var checkbox = '<input style="display:none;" class="category-filter" type="checkbox" name="options[]" value="category:' + layerCode + '" checked="checked">';
            var $variant_form = $("#variant_form");
            $variant_form.append(checkbox);
            $variant_form.submit();
        });
    };

    var enableModal = function (modal) {
        modal.height($(window).height());
        bodyHeight = $("body").height();
        $("body").height($(window).height()).css('overflow', 'hidden');
        modal.show();
    };

    var disableModal = function (modal) {
        $("body").height(bodyHeight).css('overflow', 'auto');
        modal.hide();
    };

    var loadMore = function () {
        if (!isLoadingMore && !nothingToLoad) {
            isLoadingMore = true;
            $("#load_more_text").html(i18n['productlist.loadingmore']);
            var slug = $("#collection_slug").val();
            sendLoadMoreAjax(slug, ++currentPage);
        }
    };

    var sendLoadMoreAjax = function (collectionSlug, targetPage) {
        $("#load_more_icon").addClass("icon-spin");
        var pageSize = 12;
        jsapi.filterCollectionProducts(collectionSlug, getVariants(), getOrderBy(), targetPage, pageSize)
            .done(function (data) {
                if (data.results && data.results.length > 0) {
                    var source = $("#products_template").html();
                    var template = Handlebars.compile(source);
                    var html = template({products: data.results, store: window.store});
                    var $list = $('.product-list-items');
                    var dom = $list.append(html);
                    exports.resizeImage(dom);
                    exports.initImageHolder(dom);
                    exports.initLazyImage(dom);
                }

                if (!data.results || data.results.length < pageSize) {
                    $("#load_more_icon").hide();
                    $("#load_more_text").hide();
                    nothingToLoad = true;
                }
            })
            .fail(function () {
                $("#load_more_text").html(i18n['productlist.retry']);
            })
            .always(function () {
                $("#load_more_icon").removeClass("icon-spin");
                $("#load_more_text").html(i18n['productlist.loadmore']);
                isLoadingMore = false;
            });
    };
    var getVariants = function () {
        var variant_filters = $.map($('.variant-filter')
            .find("input[type=checkbox]:checked"), function (e, i) {
            return $(e).val();
        });
        var category_filters = $.map($('.category-filters')
            .find("input[type=checkbox]:checked"), function (e, i) {
            return $(e).val();
        });
        return $.merge(variant_filters, category_filters);
    };

    var getOrderBy = function () {
        return $('.sort-filter').find("input[type=radio]:checked").val();
    };

    var calcShowMore = function () {
        $('.option-value-wrapper', ".variant-filter").each(function () {
            var $this = $(this);
            var $li = $this.find("> li");
            var canViewMore = $li.size() * $li.outerWidth() > $this.width();
            $this.closest(".option-wrapper").find(".view-more").css({visibility: canViewMore ? "visible" : "hidden"});
        });
    };

    $(function () {
        initSidebar();
        bindEvents();
        calcShowMore();
    });


})(jQuery, window);