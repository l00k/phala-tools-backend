import moment from 'moment';

export function ucfirst(str : string)
{
    return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

export function formatDate(date : Date)
{
    return moment(date).format('YYYY-MM-DD');
}

export function formatTime(date : Date)
{
    return moment(date).format('HH:mm:ss');
}

export function formatDatetime(date : Date)
{
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
}
