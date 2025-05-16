from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TerminViewSet, current_user_info

router = DefaultRouter()
router.register('termine', TerminViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('current-user/', current_user_info, name='current-user-info'),
]
