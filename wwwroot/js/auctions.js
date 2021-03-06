﻿// static variables
let state = {
    "toggled": [],
    "selected": ""
};

var DELAY = 225, clicks = 0, timer = null;
const WAIT = 750;

const trActive  = 'table-active';
const trSuccess = 'bg-success'; 
const trWarning = 'bg-warning'; 
const trDanger  = 'bg-danger'; 
const tdWarning = 'bg-warning'; 
const borderDanger = 'border-danger'; 

// on ready function
$(function () {

    $('#sessionBtn').click(function () {
        postAsyncSession(state, function (result) {
            if (result.status != 'success') {
                alert('postAsyncSession failed with statusCode ' + result.statusCode); 
            }
        });
    });

    // init #content-list
    $('.list-group-item-action').on('click', function (evt) {
        clicks++;
        var node = $(this).blur();

        if (clicks == 1) {
            timer = setTimeout(function () {
                click(node);
                $('#sessionBtn').click();
                clicks = 0;
            }, DELAY);

        } else {
            clearTimeout(timer);
            dblclick(node);
            $('#sessionBtn').click();
            clicks = 0;
        }
    })
        .on('dbclick', function (e) {
            e.preventDefault();
        });

    if (session != null) {

        if (session.Selected != null && session.Selected != '') {
            click($('#' + session.Selected.replace(".", "\\.")));
        }

        if (session.Toggled != null) {
            const data = session.Toggled.split(";");

            for (i = 0; i < data.length; i++) {
                if (data[i] != null && data[i] != '')
                    dblclick($('#' + data[i]));
            }
        }
    }

    // init #content-table
    $('#content-table > table > tbody > tr').click(function () {
        $('#content-table > table > tbody > tr').not($(this)).removeClass(trActive);
        $(this).toggleClass(trActive);
    });

    $('input[value="Bid"]').click(function () {
        var node = $('.' + trActive);
        if (node.length != 1) return false;

        let bid = {
            'id': node.attr('id'),
            'val': $('input[type="number"]').val()
        };

        if (validates(bid)) {
            postAsyncBid(bid, function (result) {
                if (result.status == 'success') {
                    node.toggleClass(trActive).toggleClass(trSuccess);
                    $('.min', node).html(null)
                        .append('<span class="fa fa-thumbs-up" style="text-align: center; display: block; margin: auto;"></span');
                    setTimeout(function () {
                        $('.min', node).html(maxBid(result.data));
                        node.toggleClass(trSuccess);
                    }, WAIT);
                }
                else {
                    errorHandler(result.statusCode, node, $('.min', node), result.data != undefined ? result.data : null);
                }
                
            });
        }
    });
 
    $('input[value="Buy"]').click(function () {
        var node = $('.' + trActive);
        if (node.length != 1) return false;

        if ($('.max', node).html() != '') {
            postAsyncBuyout({ 'id': node.attr('id') }, function (result) {
                if (result.status == 'success') {
                    node.toggleClass(trActive).toggleClass(trSuccess);
                    $('.max', node).html(null)
                        .append('<span class="fa fa-thumbs-up" style="text-align: center; display: block; margin: auto;"></span');
                    setTimeout(function () {
                        node.remove();
                    }, WAIT);
                }
                else {
                    errorHandler(result.statusCode, node, $('.max', node));
                }
            });
        }
    });

    $('input[type="button"], button').click(function () {
        $(this).blur();
    });

    var instance; 
    var disabled = true;

    $("#range").ionRangeSlider({
        type: "double",
        skin: "big", 
        grid: true,
        min: 0,
        max: 1000,
        from: 200,
        to: 800,
        prefix: "$",
        disable: disabled,
        force_edges: true,
        onChange: function (data) {
            $('#interval').html(data.from + ', ' + data.to);
        }
    });

    $('.slider').click(function () {
        instance = $('#range').data('ionRangeSlider'); 
        instance.update({
            disable: !disabled
        });
        disabled = !disabled;
    });
});

// #content-list click event
function click(node) {
    $('.list-group-item-action').not(node).removeClass('active');
    node.toggleClass('active');
    if (node.hasClass('active'))
        state.selected = $('#category').val(node.attr('id')).val();
    else
        state.selected = $('#category').val(null).val();
 
}

// #content-list dblclick event
function dblclick(node) {
    if (node.hasClass('collapser')) {
        node.siblings('div > .list-group').slideToggle();
        $('.svg-inline--fa', node)
            .toggleClass('fa-chevron-right')
            .toggleClass('fa-chevron-down');
        if (!state.toggled.includes(node.attr('id')))
            state.toggled.push(node.attr('id'))
        else
            state.toggled.splice(state.toggled.indexOf(node.attr('id')), 1); 
    }
}

// error handler for #content-table's buy/buyout buttons
function errorHandler(statusCode, parent, child, data) {

    if (statusCode == 400) {
        parent.toggleClass(trActive).toggleClass(trDanger);
        child.html(null)
            .append('<span class="fa fa-thumbs-down" style="text-align: center; display: block; margin: auto;"></span');
        setTimeout(function () {
            child.html(maxBid(data));
            parent.toggleClass(trDanger);
        }, WAIT);
    }

    if (statusCode == 404) {
        parent.toggleClass(trActive).toggleClass(trDanger);
        child.html(null)
            .append('<span class="fa fa-thumbs-down" style="text-align: center; display: block; margin: auto;"></span');
        setTimeout(function () {
            parent.remove();
        }, WAIT);
    }

    if (statusCode == 408) {
        $('#modalBtn').click();
        var modal = $('.modal-content').toggleClass(borderDanger);
        setTimeout(function () {
            modal.toggleClass(borderDanger);
        }, WAIT);
    }

    if (statusCode == 412) {
        alert('your session has expired');
        document.location.reload();
    }
}

// #content-table btn click event validation
function validates(bid) {
    var init, min, max = null; 
    const del = ' '; 
    var val = true; 
    var initWarn, minWarn, maxWarn = false; 
    const warnClass = 'border-warning'; 

    try {
        var theader = $('#content-table > table > thead > tr');
        var node = $('#' + bid.id);

        if (bid.val != null) {
            bid = parseFloat(bid.val);
        }
        else
            return false;

        if (node.children('.init').html().split(del, 1)[0] != null) {
            init = parseFloat(node.children('.init').html().split(del, 1)[0]);
        }

        if (node.children('.min').html().split(del, 1)[0] != null) {
            min = parseFloat(node.children('.min').html().split(del, 1)[0]);
        }

        if (node.children('.max').html().split(del, 1)[0] != null) {
            max = parseFloat(node.children('.max').html().split(del, 1)[0]);
        }

        if (init != null) {
            if (bid < init) {
                initWarn = true;
                val = false;
            }
        }

        if (min != null) {
            if (bid <= min) {
                minWarn = true;
                val = false;
            }
        }

        if (max != null) {
            if (max <= bid) {
                maxWarn = true;
                val = false;
            }

        }

        if (initWarn || minWarn || maxWarn) {
            if (initWarn) theader.children('.init').toggleClass(warnClass);
            if (minWarn) theader.children('.min').toggleClass(warnClass);
            if (maxWarn) theader.children('.max').toggleClass(warnClass);

            setTimeout(function () {
                if (initWarn) theader.children('.init').toggleClass(warnClass);
                if (minWarn) theader.children('.min').toggleClass(warnClass);
                if (maxWarn) theader.children('.max').toggleClass(warnClass);
            }, WAIT);
        }
    }

    catch (Exception) { return false; }

    return val;
}

function maxBid(data) {
    return Math.max.apply(Math, data.Bids.map(function (o) { return o.Amount; })) + ' ' + data.Currency;
}