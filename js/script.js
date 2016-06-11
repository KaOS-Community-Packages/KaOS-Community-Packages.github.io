jQuery.noConflict();
jQuery(document).ready(function ($) {
    function lightboxPhoto() {
        jQuery("a[rel^='prettyPhoto']").prettyPhoto({
            animationSpeed: 'fast',
            slideshow: 5000,
            theme: 'light_rounded',
            show_title: false,
            overlay_gallery: false
        });
    }

    if (jQuery().prettyPhoto) {
        lightboxPhoto();
    }
    if (jQuery().quicksand) {
        var $data = $(".portfolio-area").clone();
        $('.portfolio-categ li').click(function (e) {
            $(".filter li").removeClass("active");
            var filterClass = $(this).attr('class').split(' ').slice(-1)[0];
            if (filterClass == 'all') {
                var $filteredData = $data.find('.portfolio-item2');
            } else {
                var $filteredData = $data.find('.portfolio-item2[data-type=' + filterClass + ']');

            }
            $('#searchbox').val("");
            $(".portfolio-area").quicksand($filteredData, {
                duration: 600,
                adjustHeight: 'auto'
            }, function () {
                lightboxPhoto();
            });
            $(this).addClass("active");
            return false;
        });
        var $data2 = $('.portfolio-item2').clone();
        $('#searchbox').bind('input', function () {

            $('.portfolio-categ li').removeClass("active");
            var filterClass = $('#searchbox').val() ;
            $filteredData = $data2.filter('[data-name]:contains(' + filterClass + ')');

            $(".portfolio-area").quicksand($filteredData, {
                duration: 0
            }, function () {
                lightboxPhoto();
            });

            return false;
        });





    }
});
